# oui-data
[![](https://img.shields.io/npm/v/oui-data.svg?style=flat)](https://www.npmjs.org/package/oui-data) [![](https://img.shields.io/npm/dm/oui-data.svg)](https://www.npmjs.org/package/oui-data) [![](https://img.shields.io/bundlephobia/minzip/oui-data.svg)](https://bundlephobia.com/package/oui-data) [![](https://packagephobia.com/badge?p=oui-data)](https://packagephobia.com/result?p=oui-data)

> IEEE OUI database as JSON

## Example

The module exports a JSON file. Depending on your environment you may need to use [import attributes](https://github.com/tc39/proposal-import-attributes), [import assertions](https://nodejs.org/api/esm.html#import-assertions) or [nothing at all](https://bun.sh/guides/runtime/import-json).

Keys cover all three IEEE registries, MA-L with 6 hex chars, MA-M with 7 and MA-S with 9. MA-M and MA-S are subdivisions of MA-L prefixes assigned to `IEEE Registration Authority`, so match the longest prefix first:

```js
import ouiData from "oui-data" with {type: "json"};

const mac = "C85CE27ABCDE";
console.log(ouiData[mac.substring(0, 9)] ?? ouiData[mac.substring(0, 7)] ?? ouiData[mac.substring(0, 6)]);
//=> SYNERGY SYSTEMS AND SOLUTIONS
//=> A1526, GREEN FIELDS COLONY
//=> Faridabad HARYANA 121001
//=> India
```

© [silverwind](https://github.com/silverwind), distributed under BSD licence
