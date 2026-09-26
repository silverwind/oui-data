#!/usr/bin/env node
import {writeFileSync} from "node:fs";
import {exit} from "node:process";

const sources = [
  "https://standards-oui.ieee.org/oui/oui.txt",
  "https://standards-oui.ieee.org/oui28/mam.txt",
  "https://standards-oui.ieee.org/oui36/oui36.txt",
];

const regionNames = new Intl.DisplayNames(["en"], {type: "region"});

function isStart(firstLine: string | undefined, secondLine: string | undefined) {
  if (firstLine === undefined || secondLine === undefined) return false;
  return firstLine.trim().length === 0 && /([0-9A-F]{2}-){2}[0-9A-F]{2}/.test(secondLine);
}

// a MA-M or MA-S sub-range like "700000-7FFFFF" extends base "C85CE2" by its fixed digits to "C85CE27"
function parseAssignment(hexLine: string, base16Line: string) {
  const base = hexLine.trim().split(/\s+/)[0].replaceAll("-", "");
  const [rangeStart, rangeEnd = ""] = base16Line.trim().split(/\s+/)[0].split("-");
  const fixed = Array.from(rangeStart).findIndex((char, index) => char !== rangeEnd[index]);
  return (base + rangeStart.substring(0, fixed)).toUpperCase();
}

function parse(lines: Array<string>) {
  const result: Record<string, string> = {};
  let i = 3;
  while (i < lines.length) {
    if (isStart(lines[i], lines[i + 1])) {
      const oui = parseAssignment(lines[i + 1], lines[i + 2]);
      let owner = lines[i + 1].replace(/\((hex|base 16)\)/, "").substring(10).trim();

      i += 3;
      while (i < lines.length && !isStart(lines[i], lines[i + 1])) {
        const line = lines[i].trim();
        if (line) owner += `\n${line}`;
        i++;
      }

      result[oui] = owner
        .replace(/[ \t]+/g, " ")
        .replace(/\n([A-Z]{2})$/, (_match, code: string) => `\n${regionNames.of(code)!}`); // of() returns unassigned codes as-is
    } else {
      i++;
    }
  }
  return result;
}

async function fetchRegistry(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} failed with HTTP ${res.status}`);
  const text = await res.text();
  if (!/^(OUI|#|[A-Fa-f0-9])/.test(text)) {
    throw new Error(`${url} does not look like a IEEE registry file`);
  }
  const entries = parse(text.split("\n"));
  if (new Set(Object.keys(entries).map(key => key.length)).size !== 1) {
    throw new Error(`${url} yielded assignments of varying length`);
  }
  return entries;
}

async function main() {
  const entries = Object.assign({}, ...await Promise.all(sources.map(fetchRegistry)));
  const keys = Object.keys(entries).sort((a, b) => a.length - b.length || (Number.parseInt(a, 16) > Number.parseInt(b, 16) ? 1 : -1));
  writeFileSync(new URL("index.json", import.meta.url), JSON.stringify(entries, keys, 1));
}

try {
  await main();
  exit(0);
} catch (err) {
  console.error(err);
  exit(1);
}
