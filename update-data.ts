#!/usr/bin/env node
import {mkdirSync, writeFileSync} from "node:fs";
import {countries} from "country-data";
import {exit as exitProcess} from "node:process";

type Registry = "MA-L" | "MA-M" | "MA-S";

type Source = {
  registry: Registry;
  url: string;
  prefixLength: number;
  minRows: number;
};

// row counts as of 2026-07-02: MA-L 39,691 / MA-M 6,468 / MA-S 7,075
const sources: Array<Source> = [
  {registry: "MA-L", url: "https://standards-oui.ieee.org/oui/oui.txt", prefixLength: 6, minRows: 25_000},
  {registry: "MA-M", url: "https://standards-oui.ieee.org/oui28/mam.txt", prefixLength: 7, minRows: 3_000},
  {registry: "MA-S", url: "https://standards-oui.ieee.org/oui36/oui36.txt", prefixLength: 9, minRows: 3_000},
];

type Row = {assignment: string; name: string; address: string};

function isStart(firstLine: string | undefined, secondLine: string | undefined) {
  if (firstLine === undefined || secondLine === undefined) return false;
  return firstLine.trim().length === 0 && /([0-9A-F]{2}[-]){2}([0-9A-F]{2})/.test(secondLine);
}

function commonPrefix(a: string, b: string) {
  let i = 0;
  while (i < a.length && a[i] === b[i]) i++;
  return a.slice(0, i);
}

// MA-L entries give the assignment directly in the "(base 16)" line (e.g.
// "286FB9"). MA-M/MA-S entries instead give the base OUI-24 in the "(hex)"
// line plus a sub-range in the "(base 16)" line (e.g. "700000-7FFFFF"); the
// fixed leading hex digits of that range are the extra assignment bits, so
// base "C85CE2" + range "700000-7FFFFF" => assignment "C85CE27".
function parseAssignment(hexLine: string, base16Line: string) {
  const baseOui = hexLine.trim().split(/\s+/)[0].replace(/-/g, "").toUpperCase();
  const token = base16Line.trim().split(/\s+/)[0];
  const [start, end] = token.split("-");
  return end ? baseOui + commonPrefix(start.toUpperCase(), end.toUpperCase()) : baseOui;
}

function parse(source: Source, lines: Array<string>): Array<Row> {
  const rows: Array<Row> = [];
  let i = 3;
  while (i !== lines.length) {
    if (isStart(lines[i], lines[i + 1])) {
      const hexLine = lines[i + 1];
      const base16Line = lines[i + 2];
      const assignment = parseAssignment(hexLine, base16Line);
      if (assignment.length !== source.prefixLength) {
        throw new Error(`${source.url}: unexpected assignment "${assignment}" for registry ${source.registry}`);
      }
      const name = hexLine.replace(/\((hex|base 16)\)/, "").substring(10).trim().replace(/[ \t]+/g, " ");

      i += 3;
      const addressLines: Array<string> = [];
      while (!isStart(lines[i], lines[i + 1]) && i < lines.length) {
        const line = lines[i];
        if (line && line.trim()) addressLines.push(line.trim().replace(/[ \t]+/g, " "));
        i++;
      }

      const lastLine = addressLines.at(-1);
      if (lastLine && /^[A-Z]{2}$/.test(lastLine) && countries[lastLine]) {
        addressLines[addressLines.length - 1] = countries[lastLine].name;
      }

      rows.push({assignment, name, address: addressLines.join("\n")});
    } else {
      i++;
    }
  }
  return rows;
}

async function fetchRegistry(source: Source, retries = 3): Promise<Array<Row>> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(source.url);
      if (!res.ok) throw new Error(`${source.url} responded with ${res.status}`);
      const text = await res.text();
      if (!/^(OUI|[#]|[A-Fa-f0-9])/.test(text)) {
        throw new Error(`${source.url} does not look like an IEEE registry listing`);
      }

      const rows = parse(source, text.split("\n"));
      if (rows.length < source.minRows) {
        throw new Error(`${source.url} returned only ${rows.length} rows, expected at least ${source.minRows}`);
      }

      return rows;
    } catch (err) {
      lastError = err;
      if (attempt < retries) await new Promise(resolve => setTimeout(resolve, attempt * 2000));
    }
  }
  throw lastError;
}

function toMap(rows: Array<Row>, withAddress: boolean) {
  const result: Record<string, string> = {};
  for (const row of rows) {
    result[row.assignment] = withAddress && row.address ? `${row.name}\n${row.address}` : row.name;
  }
  return result;
}

function stringify(map: Record<string, string>) {
  const keys = Object.keys(map).sort((a, b) => a.length - b.length || (Number.parseInt(a, 16) > Number.parseInt(b, 16) ? 1 : -1));
  return JSON.stringify(map, keys, 1);
}

function exit(err?: Error | void) {
  if (err) console.error(err);
  exitProcess(err ? 1 : 0);
}

async function main() {
  const [l, m, s] = await Promise.all(sources.map(source => fetchRegistry(source)));

  const tiers: Record<string, Array<Row>> = {
    l,
    m,
    s,
    lm: [...l, ...m],
    lms: [...l, ...m, ...s],
  };

  mkdirSync(new URL("data/", import.meta.url), {recursive: true});
  for (const [name, rows] of Object.entries(tiers)) {
    writeFileSync(new URL(`data/${name}.json`, import.meta.url), stringify(toMap(rows, false)));
    writeFileSync(new URL(`data/${name}.addr.json`, import.meta.url), stringify(toMap(rows, true)));
  }
}

main().then(exit).catch(exit);
