// Progressive enhancement for the House Rules site. Every page reads and navigates without it.

const MERMAID_URL = "https://cdn.jsdelivr.net/npm/mermaid@12.1.0/dist/mermaid.esm.min.mjs";
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

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

async function renderMermaid(nodes) {
  if (nodes.length === 0) return;
  const sources = new Map(nodes.map((pre) => [pre, pre.textContent ?? ""]));
  try {
    const { default: mermaid } = await import(MERMAID_URL);
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      suppressErrorRendering: true,
      theme: matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "default",
    });
    await mermaid.run({ nodes });
  } catch (error) {
    // mermaid.run renders what it can before throwing, so only unrendered blocks are failures.
    for (const [pre, source] of sources) {
      if (pre.querySelector("svg")) continue;
      pre.textContent = source;
      pre.dataset.mermaid = "failed";
    }
    console.warn("Mermaid diagrams left as source text.", error);
  }
}

/** Point relative links at non-page files (scripts, configs, directories) to GitHub. */
function rewriteRepoLinks(main, { repo, branch = "main", source }) {
  if (!repo || !source) return;
  const dir = source.slice(0, source.lastIndexOf("/") + 1);
  for (const link of main.querySelectorAll("a[href]")) {
    const href = link.getAttribute("href") ?? "";
    if (href === "" || HAS_SCHEME.test(href) || href.startsWith("#") || href.startsWith("/")) continue;
    // A throwaway origin lets URL normalise ./ and ../ against the page's source directory.
    const resolved = new URL(href, `https://repo.invalid/${dir}`);
    const path = resolved.pathname.slice(1);
    if (path.endsWith(".html") || path.includes("/assets/") || path.startsWith("assets/")) continue;
    const kind = path.endsWith("/") ? "tree" : "blob";
    link.href = `${repo}/${kind}/${branch}/${path.replace(/\/$/, "")}${resolved.search}${resolved.hash}`;
    link.relList.add("noopener");
  }
}

function markExternalLinks(root) {
  for (const link of root.querySelectorAll("a[href]")) {
    const url = new URL(link.href, location.href);
    if (/^https?:$/.test(url.protocol) && url.origin !== location.origin) link.relList.add("noopener");
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
    button.setAttribute("aria-label", "Copy code");
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
    rewriteRepoLinks(main, document.body.dataset);
    wrapTables(main);
    addCopyButtons(main);
  }
  markExternalLinks(document);
  if (nav) markCurrentNav(nav);
  await renderMermaid(mermaidNodes);
}

await init();
