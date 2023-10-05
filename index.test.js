import ouiData from "./index.json";

test("ouiData", () => {
  expect(ouiData["203706"]).toMatch(/^Cisco/i);
});
