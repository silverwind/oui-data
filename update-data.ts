#!/usr/bin/env node
import {writeFileSync} from "node:fs";
import {countries} from "country-data";
import {exit as exitProcess} from "node:process";

const sources = {
  "index.json": "https://standards-oui.ieee.org/oui/oui.txt",
  "index-m.json": "https://standards-oui.ieee.org/oui28/mam.txt",
  "index-s.json": "https://standards-oui.ieee.org/oui36/oui36.txt",
};

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
      if (shortCode && countries[shortCode]) {
        owner = owner.replace(/\n.+$/, `\n${countries[shortCode].name}`);
      }

      result[oui] = owner;
    } else {
      i++;
    }
  }
  return result;
}

function exit(err?: Error | void) {
  if (err) console.error(err);
  exitProcess(err ? 1 : 0);
}

async function update(file: string, url: string) {
  const res = await fetch(url);
  const text = await res.text();
  if (!/^(OUI|[#]|[A-Fa-f0-9])/.test(text)) {
    throw new Error(`${url} does not look like a IEEE registry file`);
  }
  const entries = parse(text.split("\n"));
  const keys = Object.keys(entries);
  if (new Set(keys.map(key => key.length)).size !== 1) {
    throw new Error(`${url} yielded assignments of varying length`);
  }
  const json = JSON.stringify(entries, keys.sort((a, b) => Number.parseInt(a, 16) > Number.parseInt(b, 16) ? 1 : -1), 1);
  writeFileSync(new URL(file, import.meta.url), json);
}

async function main() {
  const results = await Promise.allSettled(Object.entries(sources).map(([file, url]) => update(file, url)));
  const errors = results.filter(result => result.status === "rejected").map(result => result.reason);
  if (errors.length) throw new AggregateError(errors);
}

main().then(exit).catch(exit);
