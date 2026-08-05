import {readFileSync} from "node:fs";

test("ouiData", () => {
  // json import in vitest is horribly slow, this is about 50 times faster
  const ouiData = JSON.parse(readFileSync(new URL("index.json", import.meta.url), "utf8"));
  expect(ouiData["203706"]).toMatch(/^Cisco/i);
  expect(ouiData["C85CE27"]).toMatch(/^Synergy/i);
  expect(ouiData["8C1F64AFA"]).toMatch(/^Data Electronic/i);
});
