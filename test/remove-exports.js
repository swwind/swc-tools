import assert from "node:assert";
import { transform } from "@swc/core";
import { describe, it } from "node:test";
import plugin from "@swwind/remove-exports";

console.log(plugin);

/**
 * @param {string} source
 * @param {string[]} removes
 * @returns {Promise<string>}
 */
async function remove_exports(source, removes) {
  const { code } = await transform(source, {
    jsc: {
      experimental: {
        plugins: [plugin({ removes })],
      },
      target: "esnext",
    },
  });
  return code;
}

/**
 * @param {string} code1
 * @param {string} code2
 */
function assertEquals(code1, code2) {
  assert.equal(
    code1
      .split("\n")
      .map((x) => x.trim())
      .join("\n")
      .trim(),
    code2
      .split("\n")
      .map((x) => x.trim())
      .join("\n")
      .trim()
  );
}

/**
 *
 * @param {string} source
 * @param {string[]} removes
 * @param {string} expect
 */
async function test(source, removes, expect) {
  assertEquals(await remove_exports(source, removes), expect);
}

/**
 *
 * @param {string} source
 * @param {string[]} removes
 */
async function empty(source, removes) {
  assertEquals(await remove_exports(source, removes), "");
}

describe("@swwind/remove-exports", () => {
  it("export default expr", async () => {
    await empty("export default 2333;", ["default"]);
    await empty("export default foobar;", ["default"]);
    await empty("export default (class {});", ["default"]);
    await empty("export default (class foo {});", ["default"]);
    await empty("export default (function () {});", ["default"]);
    await empty("export default (function foo() {});", ["default"]);
  });

  it("export default decl", async () => {
    await empty("export default class {}", ["default"]);
    await empty("export default class foo {}", ["default"]);
    await empty("export default function () {}", ["default"]);
    await empty("export default function* () {}", ["default"]);
    await empty("export default function foo() {}", ["default"]);
    await empty("export default function* foo() {}", ["default"]);
    await empty("export default async function () {}", ["default"]);
    await empty("export default async function* () {}", ["default"]);
    await empty("export default async function foo() {}", ["default"]);
    await empty("export default async function* foo() {}", ["default"]);
  });

  it("export decl", async () => {
    await empty("export var foo = null", ["foo"]);
    await empty("export let foo = null", ["foo"]);
    await empty("export const foo = null", ["foo"]);

    await test(
      "export const foo = 1, bar = 2",
      ["foo"],
      "export const bar = 2;"
    );

    // array pat
    await test(
      "export var [foo, , bar = 233, ...baz] = []",
      ["foo"],
      "export var [, , bar = 233, ...baz] = [];"
    );
    await test(
      "export var [foo, , bar = 233, ...baz] = []",
      ["bar"],
      "export var [foo, , , ...baz] = [];"
    );
    await test(
      "export var [foo, , bar = 233, ...baz] = []",
      ["baz"],
      "export var [foo, , bar = 233, ] = [];"
    );
    await test(
      "export var [foo, , bar = 233, ...baz] = []",
      ["foo", "bar", "baz"],
      ""
    );

    // object pat
    await test(
      "export const { foo, bar: baz, bai = 2333, ...rest } = {}",
      ["foo"],
      "export const { bar: baz, bai = 2333, ...rest } = {};"
    );
    await test(
      "export const { foo, bar: baz, bai = 2333, ...rest } = {}",
      ["bar"],
      "export const { foo, bar: baz, bai = 2333, ...rest } = {};"
    );
    await test(
      "export const { foo, bar: baz, bai = 2333, ...rest } = {}",
      ["baz"],
      "export const { foo, bai = 2333, ...rest } = {};"
    );
    await test(
      "export const { foo, bar: baz, bai = 2333, ...rest } = {}",
      ["bai"],
      "export const { foo, bar: baz, ...rest } = {};"
    );
    await test(
      "export const { foo, bar: baz, bai = 2333, ...rest } = {}",
      ["rest"],
      "export const { foo, bar: baz, bai = 2333 } = {};"
    );
    await test(
      "export const { foo, bar: baz, bai = 2333, ...rest } = {}",
      ["foo", "baz", "bai", "rest"],
      ""
    );

    // functions
    await test("export function foo() {}", ["foo"], "");
    await test("export function bar() {}", ["foo"], "export function bar() {}");
    await test("export function* foo() {}", ["foo"], "");
    await test(
      "export function* bar() {}",
      ["foo"],
      "export function* bar() {}"
    );

    // class
    await test("export class foo {}", ["foo"], "");
    await test("export class bar {}", ["foo"], "export class bar {\n}");

    // export all
    await test('export * as foo from "source";', ["foo"], "");
  });

  it("export names", async () => {
    await test("export { foo }", ["foo"], "");
    await test("export { foo as bar }", ["foo"], "export { foo as bar };");
    await test("export { bar as foo }", ["foo"], "");

    await test("export { foo, bar }", ["foo"], "export { bar };");
    await test("export { foo, bar }", ["bar"], "export { foo };");
    await test("export { foo, bar }", ["baz"], "export { foo, bar };");
    await test("export { foo, bar }", ["foo", "bar"], "");

    await test('export { foo as "😀" } ', ["😀"], "");
  });

  it("infected imports", async () => {
    await empty(
      `
      const foo = 114;
      const bar = 514;
      const baz = [];
      const a = baz || foo;
      const b = baz || bar;
      export { a, b };
      `,
      ["a", "b"]
    );

    await empty(
      `
      import { bar } from "source";
      export function foo() { bar; }
      `,
      ["foo"]
    );

    await test(
      `
      import { bar } from "source";
      bar;
      export function foo() { bar; }
      `,
      ["foo"],
      `
      import { bar } from "source";
      bar;
      `
    );

    await test(
      `
      import { bar } from "source";
      export function foo(bar) { bar; }
      `,
      ["foo"],
      `import { bar } from "source";`
    );

    await test(
      `
      import { bar } from "source";
      export function foo() { var bar; bar = 2; }
      `,
      ["foo"],
      `import { bar } from "source";`
    );

    await test(
      `
      import {} from "source";
      export function foo() {}
      `,
      ["foo"],
      `import "source";`
    );

    await test(
      `
      import "source";
      export function foo() {}
      `,
      ["foo"],
      `import "source";`
    );
  });

  it("infected decls", async () => {
    await empty(
      `
      const bar = 233;
      export function foo() { return bar; }
      `,
      ["foo"]
    );

    await empty(
      `
      function bar() { return foo(); }
      export function foo() { return bar(); }
      `,
      ["foo"]
    );

    await test(
      `
      const bar = 233;
      export function foo(bar) {}
      `,
      ["foo"],
      "const bar = 233;"
    );

    await test(
      `
      const bar = 233;
      export function foo(bar = bar) {}
      `,
      ["foo"],
      "const bar = 233;"
    );

    await empty(
      `
      import { baka } from "source";
      const baz = (foo, bar) => baka(foo, bar);
      const bar = (foo) => baz(bar, foo);
      export function foo() { bar(foo) }
      `,
      ["foo"]
    );

    await test(
      `
      import { baka } from "source";
      const baz = (foo, bar) => baka(foo, bar);
      export const bar = (foo) => baz(bar, foo);
      export function foo() { bar(foo) }
      `,
      ["foo"],
      `
      import { baka } from "source";
      const baz = (foo, bar)=>baka(foo, bar);
      export const bar = (foo)=>baz(bar, foo);
      `
    );
  });

  it("preserve unrelated code", async () => {
    await test(
      `
      import {} from "source";
      export { foo };
      `,
      ["foo"],
      `
      import "source";
      `
    );

    await empty(
      `
      import { foo } from "source";
      export { foo };
      `,
      ["foo"]
    );

    await test(
      `
      import { foo } from "source";
      foo();
      export { foo };
      `,
      ["foo"],
      `
      import { foo } from "source";
      foo();
      `
    );
  });

  it("recursive references", async () => {
    await empty(
      `
      function bar() { foo() }
      export function foo() { bar() }
      `,
      ["foo"]
    );
    await test(
      `
      function bar() { foo() }
      function foo() { bar() }
      export { foo, bar }
      `,
      ["foo"],
      `
      function bar() {
        foo();
      }
      function foo() {
        bar();
      }
      export { bar };
      `
    );
    await test(
      `
      export function bar() { foo(); }
      export function foo() { bar(); }
      `,
      ["foo"],
      `
      export function bar() {
        foo();
      }
      `
    );

    await test(
      `
      export default function bar() { foo(); }
      function foo() { bar(); }
      `,
      ["default"],
      `
      `
    );

    await test(
      `
      export default function bar() { foo(); }
      export function foo() { bar(); }
      `,
      ["default"],
      `
      export function foo() {
        bar();
      }
      `
    );
  });

  it("work for remix", async () => {
    await test(
      `
      import { useState } from "react";
      import { useLoader } from "remix";
      import { h } from "react/jsx-runtime";
      import "./style.css";
      import { db } from "~/database.ts";
      import { add } from "@/utils";
  
      const USER_ID = 114514;
  
      export const loader = async () => {
        add(114, 514);
        return await db.getUser(USER_ID);
      }
  
      export const action = async () => {
        return await db.deleteUser(USER_ID);
      }
  
      function Page(props) {
        add(114, 514);
        return h("div", null, [props.data]);
      }
  
      export default function () {
        const loader = useLoader();
        return h(Page, { data: loader }, null);
      }
      `,
      ["loader", "action"],
      `
      import { useState } from "react";
      import { useLoader } from "remix";
      import { h } from "react/jsx-runtime";
      import "./style.css";
      import { add } from "@/utils";
      function Page(props) {
        add(114, 514);
        return h("div", null, [
          props.data
        ]);
      }
      export default function() {
        const loader = useLoader();
        return h(Page, {
          data: loader
        }, null);
      }
      `
    );
  });

  it("work for qwik", async () => {
    await test(
      `
      import { loader$, action$, component$, h } from "@builder-io/qwik";
      import { database } from "sqlite";
      const USER_ID = 114514;
  
      export const useUser = loader$(async () => {
        return await database.query(USER_ID);
      });
      export const useNextUser = action$(async () => {
        return await database.query(USER_ID + 1);
      });
  
      export default component$(() => {
        const user = useUser();
        const next = useNextUser();
        return h("div", null, [user, next]);
      });
      `,
      ["useUser", "useNextUser"],
      `
      import { component$, h } from "@builder-io/qwik";
      export default component$(()=>{
        const user = useUser();
        const next = useNextUser();
        return h("div", null, [
          user,
          next
        ]);
      });
      `
    );
  });
});
