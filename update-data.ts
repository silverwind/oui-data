#!/usr/bin/env node
import {writeFileSync} from "node:fs";
import {exit as exitProcess} from "node:process";

const sources = [
  "https://standards-oui.ieee.org/oui/oui.txt",
  "https://standards-oui.ieee.org/oui28/mam.txt",
  "https://standards-oui.ieee.org/oui36/oui36.txt",
];

const regionNames = new Intl.DisplayNames(["en"], {type: "region"});

function isStart(firstLine: string | undefined, secondLine: string | undefined) {
  if (firstLine === undefined || secondLine === undefined) return false;
  return firstLine.trim().length === 0 && /([0-9A-F]{2}[-]){2}([0-9A-F]{2})/.test(secondLine);
}

// a MA-M or MA-S sub-range like "700000-7FFFFF" extends base "C85CE2" by its fixed digits to "C85CE27"
function parseAssignment(hexLine: string, base16Line: string) {
  const base = hexLine.trim().split(/\s+/)[0].replace(/-/g, "");
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
      while (!isStart(lines[i], lines[i + 1]) && i < lines.length) {
        if (lines[i] && lines[i].trim()) owner += `\n${lines[i].trim()}`;
        i++;
      }

      // remove excessive whitespace
      owner = owner.replace(/[ \t]+/g, " ");

      // replace country shortcodes
      const shortCode = (/\n([A-Z]{2})$/.exec(owner) || [])[1];
      if (shortCode) {
        const country = regionNames.of(shortCode)!; // returns the code itself when unassigned
        if (country !== shortCode) owner = owner.replace(/\n.+$/, `\n${country}`);
      }

      result[oui] = owner;
    } else {
      i++;
    }
  }
  return result;
}

function exit(err?: unknown) {
  if (err) console.error(err);
  exitProcess(err ? 1 : 0);
}

async function fetchRegistry(url: string) {
  const res = await fetch(url);
  const text = await res.text();
  if (!/^(OUI|[#]|[A-Fa-f0-9])/.test(text)) {
    throw new Error(`${url} does not look like a IEEE registry file`);
  }
  const entries = parse(text.split("\n"));
  if (new Set(Object.keys(entries).map(key => key.length)).size !== 1) {
    throw new Error(`${url} yielded assignments of varying length`);
  }
  return entries;
}

async function main() {
  const entries = Object.assign({}, ...await Promise.all(sources.map(url => fetchRegistry(url))));
  const keys = Object.keys(entries).sort((a, b) => a.length - b.length || (Number.parseInt(a, 16) > Number.parseInt(b, 16) ? 1 : -1));
  writeFileSync(new URL("index.json", import.meta.url), JSON.stringify(entries, keys, 1));
}

try {
  await main();
  exit();
} catch (err) {
  exit(err);
}
