import {existsSync, readFileSync} from "node:fs";
import pkg from "./package.json" with {type: "json"};

// json import in vitest is horribly slow, this is about 50 times faster
function load(file: string) {
  return JSON.parse(readFileSync(new URL(file, import.meta.url), "utf8"));
}

test("ouiData", () => {
  expect(load("index.json")["203706"]).toMatch(/^Cisco/i);
  expect(load("index-m.json")["C85CE27"]).toMatch(/^Synergy/i);
  expect(load("index-s.json")["8C1F64AFA"]).toMatch(/^Data Electronic/i);
});

test("exports", () => {
  for (const file of Object.values(pkg.exports)) {
    expect(existsSync(new URL(file, import.meta.url))).toBe(true);
  }
});
