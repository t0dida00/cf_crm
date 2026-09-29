const UTF8_BOM = "\uFEFF";

/**
 * Saves text as a file in the browser (a temporary link, clicked and removed).
 * A CSV starts with the UTF-8 byte-order mark, so Excel reads accented letters
 * (Vietnamese, for example) correctly instead of guessing a Windows code page.
 */
export function downloadFile(content: string, fileName: string, type = "text/csv;charset=utf-8") {
  const body = type.startsWith("text/csv") && !content.startsWith(UTF8_BOM) ? UTF8_BOM + content : content;
  const url = URL.createObjectURL(new Blob([body], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
