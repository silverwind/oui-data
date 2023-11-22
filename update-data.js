#!/usr/bin/env node
import {writeFileSync} from "node:fs";
import {countries} from "country-data";
import {exit as exitProcess} from "node:process";

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
  const entries = parse(text.split("\n"));
  const json = JSON.stringify(entries, Object.keys(entries).sort((a, b) => parseInt(a, 16) > parseInt(b, 16) ? 1 : -1), 1);
  writeFileSync(new URL("index.json", import.meta.url), json);
}

main().then(exit).catch(exit);
