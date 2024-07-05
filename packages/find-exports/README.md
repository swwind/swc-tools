# @swwind/find-exports

**This module is ESM only**

Find exports which matches the following pattern.

```js
export const name1 = func1(/* ... */);
export const name2 = func2(/* ... */);
```

where callee names (`func1` and `func2`) can be specified.

## Example

```ts
import { parse } from "@swc/core";
import { find } from "@swwind/find-exports";

const code = `
export const one = loader$(() => { return true; });
export let two = action$(() => { return false; });
export var the = loader$(() => { return false; });

// below may works, but will not match
const none = loader$(() => {}); export { none };
export const none = (0, loader$)(() => {});
export const [none = loader$(() => {})] = [];
`;

const program = await parse(code);
const found = find(program, ["loader$", "action$"]);
// => found = [
// =>   { callee: "loader$", name: "one" },
// =>   { callee: "action$", name: "two" },
// =>   { callee: "loader$", name: "the" },
// => ]
```
