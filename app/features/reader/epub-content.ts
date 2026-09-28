import type { NavItem } from "epubjs/types/navigation";

// Runs before serialization into the sandboxed iframe, including before images load.
export function protectEpubDocument(document: Document) {
  document.querySelectorAll("script, iframe, object, embed, form, base, meta[http-equiv]").forEach(node => node.remove());
  document.querySelectorAll("*").forEach(element => {
    for (const attribute of Array.from(element.attributes)) {
      if (/^on/i.test(attribute.name) || /^(javascript|https?|\/\/):?/i.test(attribute.value.trim()) && /^(src|href|xlink:href|action)$/i.test(attribute.name)) element.removeAttribute(attribute.name);
    }
  });
  const head = document.querySelector("head");
  if (!head) throw new Error("EPUB document has no head");
  const policy = document.createElementNS("http://www.w3.org/1999/xhtml", "meta");
  policy.setAttribute("http-equiv", "Content-Security-Policy");
  policy.setAttribute("content", "default-src 'none'; img-src blob: data:; style-src 'unsafe-inline' blob: data:; font-src blob: data:; media-src blob: data:; script-src 'none'; connect-src 'none'; form-action 'none'; base-uri 'none'");
  head.prepend(policy);
}
export function flattenContents(items: NavItem[], depth = 0): { href: string; label: string }[] {
  return items.flatMap(item => [{ href: item.href, label: `${"— ".repeat(depth)}${item.label.trim()}` }, ...flattenContents(item.subitems ?? [], depth + 1)]);
}
