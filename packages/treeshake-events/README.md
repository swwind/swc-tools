# @swwind/treeshake-events

Remove specific properties from generated jsx function calls.

Before

```js
import { jsx as _jsx } from "preact/jsx-runtime";

_jsx("div", { id: "app", onClick: () => alert(2333) });
```

After

```js
import { jsx as _jsx } from "preact/jsx-runtime";

_jsx("div", { id: "app" });
```

# Usage

```ts
interface PluginOptions {
  // jsx function names
  jsxs: string[]; // defaults ['jsx', 'jsxs', 'jsxDEV']
  // event properties regex
  matches: string[]; // defaults ['^on[A-Z]']
}

jsc: {
  // ...
  experimental: {
    plugins: [
      [
        "@swwind/treeshake-events",
        {
          /* PluginOptions */
        },
      ],
    ];
  }
}
```
