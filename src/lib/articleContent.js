const ALLOWED_TAGS = new Set([
  "A", "B", "BLOCKQUOTE", "BR", "DIV", "EM", "H1", "H2", "H3", "H4",
  "I", "LI", "OL", "P", "S", "STRONG", "U", "UL", "SPAN", "SUB", "SUP", "HR",
  "IMG", "FIGURE", "FIGCAPTION", "TABLE", "THEAD", "TBODY", "TR", "TD", "TH", "CODE", "PRE",
]);
const DROP_TAGS = new Set(["SCRIPT", "STYLE", "IFRAME", "OBJECT", "SVG", "TEMPLATE", "HEAD", "META", "LINK"]);

// Style yang ikut terbawa saat paste (aman, tidak merusak layout)
// Gaya yang ikut terbawa saat paste (tampilan sama seperti sumber, tapi tidak merusak layout)
const STYLE_PROPS = ["color", "background-color", "font-weight", "font-style", "font-size", "font-family", "text-decoration", "text-align"];
const SAFE_VALUE = /^[\w\s#%.,()'"\-+/]+$/; // nilai CSS aman (tanpa url(), titik-koma, dll)

// Hanya warna putih/hampir putih yang dibuang (tak terbaca di latar terang)
function isNearWhite(v) {
  if (/^(white|transparent|inherit|initial|windowtext)$/i.test(v)) return true;
  let rgb = null;
  const hex = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].replace(/./g, "$&$&") : hex[1];
    rgb = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  }
  const m = v.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
  if (m) rgb = [+m[1], +m[2], +m[3]];
  return rgb ? Math.min(...rgb) > 235 : false;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function safeStyle(node) {
  const out = [];
  for (const prop of STYLE_PROPS) {
    let v = node.style?.getPropertyValue(prop)?.trim();
    if (!v || !SAFE_VALUE.test(v) || /url|expression|javascript/i.test(v)) continue;
    if (prop === "background-color" && isNearWhite(v)) continue;
    if (prop === "color" && isNearWhite(v)) continue;
    if (prop === "font-weight" && /^(normal|400)$/.test(v)) continue;
    out.push(`${prop}:${v}`);
  }
  // <font color="..."> bawaan HTML lama
  if (node.tagName === "FONT" && !out.some((x) => x.startsWith("color")) && /^#?[\w]+$/.test(node.getAttribute("color") ?? "")) {
    out.push(`color:${node.getAttribute("color")}`);
  }
  return out.join(";");
}

function cleanNode(node) {
  if (node.nodeType === Node.TEXT_NODE) return escapeHtml(node.nodeValue ?? "");
  if (node.nodeType !== Node.ELEMENT_NODE) return "";
  if (DROP_TAGS.has(node.tagName)) return "";

  if (node.tagName === "IMG") {
    const src = node.getAttribute("src") ?? "";
    if (!/^(https?:\/\/|data:image\/(png|jpe?g|gif|webp);base64,)/i.test(src)) return "";
    return `<img src="${escapeHtml(src)}" alt="${escapeHtml(node.getAttribute("alt") ?? "")}" loading="lazy" referrerpolicy="no-referrer">`;
  }

  const children = Array.from(node.childNodes, cleanNode).join("");
  const isFont = node.tagName === "FONT";
  if (!ALLOWED_TAGS.has(node.tagName) && !isFont) return children;

  if (node.tagName === "A") {
    const href = node.getAttribute("href") ?? "";
    if (/^(https?:|mailto:)/i.test(href)) {
      return `<a href="${escapeHtml(href)}" rel="noopener noreferrer">${children}</a>`;
    }
    return children;
  }

  const style = safeStyle(node);
  if (isFont || (node.tagName === "SPAN" && !style)) {
    return style ? `<span style="${escapeHtml(style)}">${children}</span>` : children;
  }
  const tag = node.tagName.toLowerCase();
  if (tag === "br" || tag === "hr") return `<${tag}>`;
  return `<${tag}${style ? ` style="${escapeHtml(style)}"` : ""}>${children}</${tag}>`;
}

export function sanitizeArticleHtml(value = "") {
  const content = String(value);
  if (!content) return "";

  const parsed = new DOMParser().parseFromString(content, "text/html");
  const hasMarkup = /<\/?[a-z][^>]*>/i.test(content);
  const html = Array.from(parsed.body.childNodes, cleanNode).join("");

  return hasMarkup ? html : html.replace(/\r\n?|\n/g, "<br>");
}
