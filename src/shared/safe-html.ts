export function escapeHtml(value: unknown): string {
  if (value == null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface RawHtml {
  readonly __raw: true;
  readonly value: string;
}

export function raw(htmlString: string): RawHtml {
  return { __raw: true, value: htmlString };
}

export function isRawHtml(value: unknown): value is RawHtml {
  return typeof value === "object" && value !== null && "__raw" in value && (value as RawHtml).__raw === true;
}

export function html(strings: TemplateStringsArray, ...values: unknown[]): string {
  let result = strings[0];
  for (let i = 0; i < values.length; i++) {
    const val = values[i];
    if (Array.isArray(val)) {
      result += val.map((item) => (isRawHtml(item) ? item.value : escapeHtml(item))).join("");
    } else if (isRawHtml(val)) {
      result += val.value;
    } else {
      result += escapeHtml(val);
    }
    result += strings[i + 1];
  }
  return result;
}
