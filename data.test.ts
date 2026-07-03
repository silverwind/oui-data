import {readFileSync} from "node:fs";

// json import in vitest is horribly slow, this is about 50 times faster
function loadJson(name: string) {
  return JSON.parse(readFileSync(new URL(`data/${name}.json`, import.meta.url), "utf8"));
}

const maL = "00000C"; // Cisco Systems, Inc
const maM = "C85CE27"; // Synergy Systems and Solutions
const maS = "8C1F64AFA"; // Data Electronic Devices, Inc

test("bare variants contain the org name without an address", () => {
  expect(loadJson("l")[maL]).toMatch(/^Cisco Systems/i);
  expect(loadJson("l")[maL]).not.toContain("\n");
  expect(loadJson("m")[maM]).toMatch(/^Synergy Systems/i);
  expect(loadJson("m")[maM]).not.toContain("\n");
  expect(loadJson("s")[maS]).toMatch(/^Data Electronic Devices/i);
  expect(loadJson("s")[maS]).not.toContain("\n");
});

test("addr variants append the org address after a newline", () => {
  expect(loadJson("l.addr")[maL]).toMatch(/^Cisco Systems, Inc\n/i);
  expect(loadJson("m.addr")[maM]).toMatch(/^Synergy Systems and Solutions\n/i);
  expect(loadJson("s.addr")[maS]).toMatch(/^Data Electronic Devices, Inc\n/i);
});

test("l tier only contains MA-L prefixes", () => {
  const l = loadJson("l");
  expect(l[maL]).toBeDefined();
  expect(l[maM]).toBeUndefined();
  expect(l[maS]).toBeUndefined();
});

test("lm tier merges MA-L and MA-M but not MA-S", () => {
  const lm = loadJson("lm");
  expect(lm[maL]).toBeDefined();
  expect(lm[maM]).toBeDefined();
  expect(lm[maS]).toBeUndefined();
});

test("lms tier merges all three registries", () => {
  const lms = loadJson("lms");
  expect(lms[maL]).toBeDefined();
  expect(lms[maM]).toBeDefined();
  expect(lms[maS]).toBeDefined();
});
