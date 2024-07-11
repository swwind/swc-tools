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
import removeExports from "@swwind/remove-exports";

interface PluginOptions {
  // export names to remove
  removes?: string[];
}

jsc: {
  // ...
  experimental: {
    plugins: [
      removeExports(options),
    ];
  }
}
```

Note: this plugin does not support use module name directly.
