import {readFileSync} from "node:fs";

test("ouiData", () => {
  // json import in vitest is horribly slow, this is about 50 times faster
  const ouiData = JSON.parse(readFileSync(new URL("data/l.addr.json", import.meta.url), "utf8"));
  expect(ouiData["203706"]).toMatch(/^Cisco/i);
});
