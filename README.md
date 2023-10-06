# oui-data
[![](https://img.shields.io/npm/v/oui-data.svg?style=flat)](https://www.npmjs.org/package/oui-data) [![](https://img.shields.io/npm/dm/oui-data.svg)](https://www.npmjs.org/package/oui-data) [![](https://img.shields.io/bundlephobia/minzip/oui-data.svg)](https://bundlephobia.com/package/oui-data) [![](https://packagephobia.com/badge?p=oui-data)](https://packagephobia.com/result?p=oui-data)

> IEEE OUI database as JSON

## Example

Depending on your environment you may need to use [import attributes](https://github.com/tc39/proposal-import-attributes), [import assertions](https://nodejs.org/api/esm.html#import-assertions) or [nothing at all](https://bun.sh/guides/runtime/import-json).

```js
import ouiData from "oui-data";

console.log(ouiData["203706"]);
//=> Cisco Systems, Inc
//=> 80 West Tasman Drive
//=> San Jose CA 94568
//=> United States
```

© [silverwind](https://github.com/silverwind), distributed under BSD licence
