# oui-data
[![](https://img.shields.io/npm/v/oui-data.svg?style=flat)](https://www.npmjs.org/package/oui-data) [![](https://img.shields.io/npm/dm/oui-data.svg)](https://www.npmjs.org/package/oui-data) [![](https://img.shields.io/bundlephobia/minzip/oui-data.svg)](https://bundlephobia.com/package/oui-data) [![](https://packagephobia.com/badge?p=oui-data)](https://packagephobia.com/result?p=oui-data)

> IEEE OUI database as JSON

## Example

The module exports a JSON file. Depending on your environment you may need to use [import attributes](https://github.com/tc39/proposal-import-attributes), [import assertions](https://nodejs.org/api/esm.html#import-assertions) or [nothing at all](https://bun.sh/guides/runtime/import-json).

```js
import ouiData from "oui-data" with {type: "json"};

console.log(ouiData["203706"]);
//=> Cisco Systems, Inc
//=> 80 West Tasman Drive
//=> San Jose CA 94568
//=> United States
```

## Registry variants

The default export above (`oui-data`) is equivalent to `oui-data/l.addr` and only covers **MA-L** (the
classic 24-bit "OUI"), with address, for backwards compatibility. IEEE also
runs two smaller assignment registries, **MA-M** (28-bit) and **MA-S**
(36-bit, formerly "IAB"). This package additionally builds a flat prefix
&rarr; organization-name map for each registry, and for combinations of
them, with and without the organization address, as separate JSON files so
consumers only fetch the variant they need:

| Subpath        | Registries covered | Value                    |
| --------------- | ------------------- | ------------------------- |
| `oui-data/l`      | MA-L                 | name                      |
| `oui-data/l.addr` | MA-L                 | name + `\n` + address     |
| `oui-data/m`      | MA-M                 | name                      |
| `oui-data/m.addr` | MA-M                 | name + `\n` + address     |
| `oui-data/s`      | MA-S                 | name                      |
| `oui-data/s.addr` | MA-S                 | name + `\n` + address     |
| `oui-data/lm`     | MA-L + MA-M          | name                      |
| `oui-data/lm.addr`| MA-L + MA-M          | name + `\n` + address     |
| `oui-data/lms`    | MA-L + MA-M + MA-S   | name                      |
| `oui-data/lms.addr`| MA-L + MA-M + MA-S  | name + `\n` + address     |

Keys are the raw uppercase hex assignment prefix (6 hex chars for MA-L, 7 for
MA-M, 9 for MA-S). Combined variants (`lm`, `lms`) mix prefix lengths in the
same object; do a longest-prefix match by trying the 9-, 7-, then 6-char
slice of a MAC address against the map.

© [silverwind](https://github.com/silverwind), distributed under BSD licence
