import { find } from "@swwind/find-exports";
import { parseSync } from "@swc/core";
import { deepEqual as assertEquals, throws as assertThrows } from "node:assert";
import { describe, it } from "node:test";

function find_exports(code, funcs) {
  const ast = parseSync(code, {
    syntax: "typescript",
    tsx: true,
  });
  return find(ast, funcs);
}

describe("@swwind/find-exports", () => {
  it("should work", () => {
    const code = `
    export const one = loader$(() => { return true; });
    export let two = action$(() => { return false; });
    export var the = loader$(() => { return false; });

    // below may works, but will not match
    const none = loader$(() => {}); export { none };
    export const none = (0, loader$)(() => {});
    export const [none = loader$(() => {})] = [];
    `;

    const found = find_exports(code, ["loader$", "action$"]);

    assertEquals(found, [
      { callee: "loader$", name: "one" },
      { callee: "action$", name: "two" },
      { callee: "loader$", name: "the" },
    ]);
  });

  it("should work for typescript", () => {
    const code = `
    export const one: Loader = loader$<T>(() => { return true; });
    export const two: Action = action$<{ name: string }>(() => { return false; });
    export const the: {} | null = loader$(() => { return false; });
    `;

    const found = find_exports(code, ["loader$", "action$"]);

    assertEquals(found, [
      { callee: "loader$", name: "one" },
      { callee: "action$", name: "two" },
      { callee: "loader$", name: "the" },
    ]);
  });

  it("should work for tsx", () => {
    const code = `
    export const one: Loader = loader$<div>(() => { return <div> hello world </div>; });
    export const two: Action = action$(() => { return <span> export const v = loader$() </span>; });
    export const the: {} | null = loader$(() => { return null; });
    `;

    const found = find_exports(code, ["loader$", "action$"]);

    assertEquals(found, [
      { callee: "loader$", name: "one" },
      { callee: "action$", name: "two" },
      { callee: "loader$", name: "the" },
    ]);
  });

  it("should throw on invalid code", () => {
    const code = `
    a7268t612t*^T@&^(!%&^T@^!!R&@^(TR^!@T(*R!TR%)!@&%^(*@&!%(@!)()()())
    `;

    assertThrows(() => find_exports(code, []));
    assertThrows(() => find_exports(code, []));
    assertThrows(() => find_exports(code, []));
    assertEquals(find_exports(`export const foo = bar();`, ["bar"]), [
      { callee: "bar", name: "foo" },
    ]);
  });
});
