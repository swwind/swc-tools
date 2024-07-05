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

Note: the treeshake only works when

1. `jsx` function must use import statement and listed in `options.jsxs`
2. `jsx` function can be renamed to other idents (doesn't matter our trackings)
3. first argument of `jsx` is string literal and second is object literal.
4. property name must be ident or string (no `{ ["onClick"]: () => {} }` please)

If all the conditions are true, a treeshake of that property will be performed.

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
