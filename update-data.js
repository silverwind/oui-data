#!/usr/bin/env node
import {writeFileSync} from "node:fs";
import fetchEnhanced from "fetch-enhanced";
import nodeFetch from "node-fetch";
import {countries} from "country-data";
import stringify from "json-stable-stringify";
import {exit as exitProcess} from "node:process";

const fetch = fetchEnhanced(nodeFetch, {undici: false});

function isStart(firstLine, secondLine) {
  if (firstLine === undefined || secondLine === undefined) return false;
  return firstLine.trim().length === 0 && /([0-9A-F]{2}[-]){2}([0-9A-F]{2})/.test(secondLine);
}

function parse(lines) {
  const result = {};
  let i = 3;
  while (i !== lines.length) {
    if (isStart(lines[i], lines[i + 1])) {
      const oui = lines[i + 2].substring(0, 6).trim().toUpperCase();
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
    }
  }
  return result;
}

function exit(err) {
  if (err) console.error(err);
  exitProcess(err ? 1 : 0);
}

async function main() {
  const res = await fetch("https://standards-oui.ieee.org/");
  const text = await res.text();
  if (!/^(OUI|[#]|[A-Fa-f0-9])/.test(text)) {
    throw new Error("Downloaded file does not look like a oui-data.txt file");
  }
  const result = parse(text.split("\n"));
  writeFileSync(new URL("index.json", import.meta.url), stringify(result, {
    space: 1,
    cmp: (a, b) => parseInt(a.key, 16) > parseInt(b.key, 16) ? 1 : -1,
  }));
}

main().then(exit).catch(exit);
