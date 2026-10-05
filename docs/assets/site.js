// Progressive enhancement for the House Rules site. Every page reads and navigates without it.

const MERMAID_URL = "https://cdn.jsdelivr.net/npm/mermaid@12.1.0/dist/mermaid.esm.min.mjs";

/** Swap each kramdown mermaid block for `<pre class="mermaid">` holding the diagram source. */
function replaceMermaidBlocks(main) {
  const nodes = [];
  for (const code of main.querySelectorAll("pre > code")) {
    const rouge = code.closest("div.language-mermaid");
    const container = rouge ?? (code.classList.contains("language-mermaid") ? code.parentElement : null);
    if (!container) continue;
    const pre = document.createElement("pre");
    pre.className = "mermaid";
    pre.textContent = code.textContent ?? "";
    container.replaceWith(pre);
    nodes.push(pre);
  }
  return nodes;
}

/** Mermaid `base` theme variables from the page palette; null until the stylesheet defines `--ink`. */
function paletteFromCss() {
  const style = getComputedStyle(document.documentElement);
  const read = (name) => style.getPropertyValue(name).trim();
  const ink = read("--ink");
  if (ink === "") return null;
  const bg = read("--bg");
  const bg2 = read("--bg-2");
  const accent2 = read("--accent-2");
  const byValue = [
    [bg2, ["background", "mainBkg", "primaryColor", "actorBkg"]],
    [ink, ["primaryTextColor", "textColor", "primaryBorderColor", "nodeBorder", "lineColor", "clusterBorder"]],
    [ink, ["noteTextColor", "actorBorder", "actorTextColor", "signalColor", "signalTextColor"]],
    [accent2, ["secondaryColor", "noteBkgColor"]],
    [bg, ["tertiaryColor", "clusterBkg", "edgeLabelBackground"]],
  ];
  const vars = { fontFamily: read("--font-body"), fontSize: "15px" };
  for (const [value, names] of byValue) for (const name of names) vars[name] = value;
  return vars;
}

async function renderMermaid(nodes) {
  if (nodes.length === 0) return;
  const sources = new Map(nodes.map((pre) => [pre, pre.textContent ?? ""]));
  try {
    const { default: mermaid } = await import(MERMAID_URL);
    const palette = paletteFromCss();
    const theme = palette
      ? { theme: "base", themeVariables: palette }
      : { theme: matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "default" };
    mermaid.initialize({ startOnLoad: false, securityLevel: "strict", suppressErrorRendering: true, ...theme });
    await mermaid.run({ nodes });
  } catch {
    // mermaid.run renders what it can before throwing, so only unrendered blocks are failures.
    for (const [pre, source] of sources) {
      if (pre.querySelector("svg")) continue;
      pre.textContent = source;
      pre.dataset.mermaid = "failed";
    }
  }
}

function withTrailingSlash(pathname) {
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

function markCurrentNav(nav) {
  const here = withTrailingSlash(location.pathname);
  for (const link of nav.querySelectorAll("a[href]")) {
    if (withTrailingSlash(new URL(link.href, location.href).pathname) === here) {
      link.setAttribute("aria-current", "page");
    }
  }
}

function wrapTables(main) {
  for (const table of main.querySelectorAll("table")) {
    if (table.parentElement?.classList.contains("table-wrap")) continue;
    const wrap = document.createElement("div");
    wrap.className = "table-wrap";
    table.replaceWith(wrap);
    wrap.append(table);
  }
}

function addCopyButtons(main) {
  if (!navigator.clipboard) return;
  for (const code of main.querySelectorAll("pre > code")) {
    const pre = code.parentElement;
    if (!pre || pre.classList.contains("mermaid")) continue;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "copy";
    button.textContent = "Copy";
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(code.textContent ?? "");
      } catch {
        return;
      }
      button.textContent = "Copied";
      setTimeout(() => {
        button.textContent = "Copy";
      }, 1500);
    });
    pre.append(button);
  }
}

async function init() {
  const main = document.querySelector("main#content");
  const nav = document.querySelector('nav[aria-label="Site"]');
  const mermaidNodes = main ? replaceMermaidBlocks(main) : [];
  if (main) {
    wrapTables(main);
    addCopyButtons(main);
  }
  if (nav) markCurrentNav(nav);
  await renderMermaid(mermaidNodes);
}

await init();
