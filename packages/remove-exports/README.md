# @swwind/remove-exports

A SWC plugin for removing named exports and related imports from a module.

## Example

Before

```js
import { deps } from "./deps.ts";
export const foo = deps();
export const bar = 2333;
```

After removing `foo`.

```js
export const bar = 2333;
```

## Usage

```ts
interface PluginOptions {
  // export names to remove
  removes: string[];
}

jsc: {
  // ...
  experimental: {
    plugins: [
      [
        "@swwind/remove-exports",
        {
          /* PluginOptions */
        },
      ],
    ];
  }
}
```

You can also use the default export as it references where the wasm file is. (ESM only)

```ts
import removeExports from "@swwind/remove-exports";

plugins: [
  [
    removeExports,
    {
      /* PluginOptions */
    },
  ],
];
```
