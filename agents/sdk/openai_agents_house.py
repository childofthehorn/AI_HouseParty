"""Build OpenAI Agents SDK agents from the house's markdown definitions.

The source of truth stays `agents/**/*.md`. This module reads those files at
runtime and returns `agents.Agent` objects wired the way the house works:
`host-agent` and `eng-manager-agent` call the others as tools (the manager keeps
control), and every agent carries its description as `handoff_description`.

    pip install openai-agents            # in your project, not this repo
    from openai_agents_house import load_house
    from agents import Runner

    house = load_house(tools={"read": [read_file], "shell": [run_shell]})
    result = Runner.run_sync(house["host-agent"], "Review PR 123 against our architecture.")
    print(result.final_output)

Tool names in the markdown are Claude Code's. They map to capabilities here, and
you supply function tools per capability:

    read     Read, Grep, Glob          write    Edit, Write
    shell    Bash                      web      WebFetch, WebSearch
    delegate Agent                     (wired below, not a tool you supply)

Any agent whose capabilities you don't supply simply gets fewer tools. House rules
(AGENTS.md) still apply to whatever the agents produce.
"""
from __future__ import annotations

import json
import pathlib
import re

CAPABILITY = {
    "Read": "read", "Grep": "read", "Glob": "read",
    "Edit": "write", "Write": "write",
    "Bash": "shell",
    "WebFetch": "web", "WebSearch": "web",
    "Agent": "delegate",
}
# Who calls whom as a tool. host-agent reaches everyone; eng-manager reaches the specialists.
ORCHESTRATORS = {
    "host-agent": lambda names: [n for n in names if n != "host-agent"],
    "eng-manager-agent": lambda names: [n for n in names if n not in ("host-agent", "eng-manager-agent")],
}


def _frontmatter(text: str) -> tuple[dict, str]:
    m = re.match(r"\A---\n(.*?)\n---\n(.*)\Z", text, re.S)
    if not m:
        raise ValueError("no frontmatter")
    meta = {}
    for line in m.group(1).splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        key, _, value = line.partition(":")
        value = value.strip()
        meta[key.strip()] = json.loads(value) if value.startswith('"') else value
    return meta, m.group(2).strip("\n")


def read_definitions(root: str | pathlib.Path | None = None) -> dict[str, dict]:
    """Parse agents/**/*.md into {name: {description, instructions, capabilities, path}}."""
    root = pathlib.Path(root) if root else pathlib.Path(__file__).resolve().parent.parent
    defs = {}
    for path in sorted(root.glob("*/*.md")):
        if path.name == "README.md":
            continue
        meta, body = _frontmatter(path.read_text())
        tools = [t.strip() for t in meta.get("tools", "").split(",") if t.strip()]
        # No tools line means "inherits everything" in Claude Code.
        caps = {CAPABILITY[t] for t in tools if t in CAPABILITY} if tools else set(CAPABILITY.values())
        defs[meta["name"]] = {
            "description": meta["description"],
            "instructions": body,
            "capabilities": caps,
            "path": str(path.relative_to(root)),
        }
    return defs


def load_house(tools: dict[str, list] | None = None, model=None, root=None, include: set[str] | None = None) -> dict:
    """Return {name: Agent}. `tools` maps capability -> list of SDK function tools."""
    from agents import Agent  # openai-agents; imported here so reading definitions needs no SDK

    tools = tools or {}
    defs = read_definitions(root)
    if include:
        defs = {n: d for n, d in defs.items() if n in include}
    agents = {}
    for name, d in defs.items():
        own = [t for cap in sorted(d["capabilities"]) for t in tools.get(cap, [])]
        agents[name] = Agent(
            name=name,
            instructions=d["instructions"],
            handoff_description=d["description"],
            tools=own,
            **({"model": model} if model else {}),
        )
    # Orchestrators get the others as tools, so they keep control and synthesize.
    for name, pick in ORCHESTRATORS.items():
        if name in agents and "delegate" in defs[name]["capabilities"]:
            agents[name].tools.extend(
                agents[other].as_tool(
                    tool_name=other.replace("-", "_"),
                    tool_description=defs[other]["description"][:1024],
                )
                for other in pick(list(agents))
            )
    return agents


if __name__ == "__main__":
    for name, d in read_definitions().items():
        print(f"{name:28} {','.join(sorted(d['capabilities'])):28} {d['path']}")
