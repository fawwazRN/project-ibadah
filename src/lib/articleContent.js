const ALLOWED_TAGS = new Set([
  "A", "B", "BLOCKQUOTE", "BR", "DIV", "EM", "H1", "H2", "H3", "H4",
  "I", "LI", "OL", "P", "S", "STRONG", "U", "UL",
]);
const DROP_TAGS = new Set(["SCRIPT", "STYLE", "IFRAME", "OBJECT", "SVG", "TEMPLATE"]);

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function cleanNode(node) {
  if (node.nodeType === Node.TEXT_NODE) return escapeHtml(node.nodeValue ?? "");
  if (node.nodeType !== Node.ELEMENT_NODE) return "";
  if (DROP_TAGS.has(node.tagName)) return "";

  const children = Array.from(node.childNodes, cleanNode).join("");
  if (!ALLOWED_TAGS.has(node.tagName)) return children;

  if (node.tagName === "A") {
    const href = node.getAttribute("href") ?? "";
    if (/^(https?:|mailto:)/i.test(href)) {
      return `<a href="${escapeHtml(href)}" rel="noopener noreferrer">${children}</a>`;
    }
    return children;
  }

  return `<${node.tagName.toLowerCase()}>${children}</${node.tagName.toLowerCase()}>`;
}

export function sanitizeArticleHtml(value = "") {
  const content = String(value);
  if (!content) return "";

  const parsed = new DOMParser().parseFromString(content, "text/html");
  const hasMarkup = /<\/?[a-z][^>]*>/i.test(content);
  const html = Array.from(parsed.body.childNodes, cleanNode).join("");

  return hasMarkup ? html : html.replace(/\r\n?|\n/g, "<br>");
}
