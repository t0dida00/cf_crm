import { t } from "./i18n";

/** CSV and UTF-8 for every file Tably reads or writes: parse and write rows,
 * mark files as UTF-8 for spreadsheet apps, and read picked files strictly. */

/**
 * Marks a file as UTF-8 for spreadsheet apps: without it Excel opens a CSV in
 * the Windows code page, and "Phở" shows as "PhÆ¡Ì‰". Exports and the sample
 * start with it; parseCsv skips it.
 */
export const UTF8_BOM = "\uFEFF";

/** The file isn't UTF-8 (usually Excel's plain "CSV (Comma delimited)"). */
export class NotUtf8Error extends Error {
  constructor() {
    super(t("admin.csv.notUtf8"));
  }
}

/**
 * Reads a picked file's bytes as UTF-8, strictly: bytes that aren't valid
 * UTF-8 throw NotUtf8Error instead of turning into replacement characters.
 */
export function decodeCsvFile(bytes: ArrayBuffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new NotUtf8Error();
  }
}

/** Parses CSV text (RFC 4180: quoted fields, "" for a quote, CRLF or LF). Blank lines are skipped. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((f) => f.trim() !== ""));
}

/** Writes rows as CSV, quoting only fields that need it. */
export function toCsv(rows: string[][]): string {
  const cell = (v: string) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return rows.map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}
