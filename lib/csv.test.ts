import { describe, expect, test } from "vitest";
import { parseCsv, toCsv } from "./csv";

describe("parseCsv / toCsv", () => {
  test("reads quoted fields with commas, quotes and line breaks", () => {
    expect(parseCsv('a,"b, c","say ""hi""","two\nlines"\r\n1,2,3,4\n')).toEqual([
      ["a", "b, c", 'say "hi"', "two\nlines"],
      ["1", "2", "3", "4"],
    ]);
  });

  test("skips blank lines and a leading byte-order mark", () => {
    expect(parseCsv("﻿a,b\n\n,\nc,d")).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });

  test("round-trips through toCsv", () => {
    const rows = [["plain", "with, comma", 'a "quote"', "multi\nline"]];
    expect(parseCsv(toCsv(rows))).toEqual(rows);
  });
});
