# @swwind/get-exports

**This module is ESM only**

Get ES Module exports using [SWC](https://swc.rs/) AST.

# Example

```ts
import { parse } from "@swc/core";
import { get } from "@swwind/get-exports";

const program = await parse(
  `
  export const foo: number = 2333;
  export { foo as "😅" };
  export default () => {};
  `,
  { syntax: "typescript" }
);
const exports = get(program);
// exports = [
//   { type: "ident", name: "foo" },
//   { type: "str", name: "😅" },
//   { type: "default" },
// ]
```
