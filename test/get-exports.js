import { get } from "@swwind/get-exports";
import { parseSync } from "@swc/core";
import { deepEqual as assertEquals, throws as assertThrows } from "node:assert";
import { describe, it } from "node:test";

/**
 * @param {string} code
 * @returns {import("@swwind/get-exports").Export[]}
 */
function get_exports(code) {
  const module = parseSync(code, { syntax: "typescript", tsx: true });
  return get(module);
}

describe("@swwind/get-exports", () => {
  it("export { name }", () => {
    assertEquals(
      get_exports(`
      export { one };
      export { two } from "source";
      `),
      [
        { type: "ident", name: "one" },
        { type: "ident", name: "two" },
      ]
    );
  });

  it("export { name as other }", () => {
    assertEquals(
      get_exports(`
      export { _one as one };
      export { _two as two } from "source";
      export { _three as "😄" } from "source";
      export { _four as four } from "source";
      export { _five as default } from "source";
      `),
      [
        { type: "ident", name: "one" },
        { type: "ident", name: "two" },
        { type: "str", name: "😄" },
        { type: "ident", name: "four" },
        { type: "default" },
      ]
    );
  });

  it("export const name", () => {
    assertEquals(
      get_exports(`
      export const one = 233;
      export let two = 114;
      export var three = 514;
      `),
      [
        { type: "ident", name: "one" },
        { type: "ident", name: "two" },
        { type: "ident", name: "three" },
      ]
    );
  });

  it("export const { name }", () => {
    assertEquals(
      get_exports(`
      export const { one, _two: two, [1 + 2]: three, four = 2, ...five } = {};
      `),
      [
        { type: "ident", name: "one" },
        { type: "ident", name: "two" },
        { type: "ident", name: "three" },
        { type: "ident", name: "four" },
        { type: "ident", name: "five" },
      ]
    );
  });

  it("export const [ name ]", () => {
    assertEquals(
      get_exports(`
      export const [one, two = 2, , , three, ...four] = [];
      `),
      [
        { type: "ident", name: "one" },
        { type: "ident", name: "two" },
        { type: "ident", name: "three" },
        { type: "ident", name: "four" },
      ]
    );
  });

  it("export using name", () => {
    assertThrows(() => {
      get_exports(`
      export using one = {};
      `);
    });
  });

  it("export class name", () => {
    assertEquals(
      get_exports(`
      export class one {};
      `),
      [{ type: "ident", name: "one" }]
    );
  });

  it("export function name", () => {
    assertEquals(
      get_exports(`
      export function one() {};
      `),
      [{ type: "ident", name: "one" }]
    );
  });

  it("export ts enum", () => {
    assertEquals(
      get_exports(`
      export enum one {}
      `),
      [{ type: "ident", name: "one" }]
    );
  });

  it("export default", () => {
    assertEquals(get_exports(`export default () => {};`), [
      { type: "default" },
    ]);
    assertEquals(get_exports(`export default 2333;`), [{ type: "default" }]);
    assertEquals(get_exports(`export default function one();`), []);
    assertEquals(get_exports(`export default function one() {};`), [
      { type: "default" },
    ]);
    assertEquals(get_exports(`export default class one {};`), [
      { type: "default" },
    ]);
    assertEquals(get_exports(`export default interface one {};`), []);
  });

  it("ignore all types", () => {
    assertEquals(
      get_exports(`
      export function one();
      export declare function one2();
      export declare class two {};
      export type three = string;
      export interface four {}
      export declare interface four2 {}
      export declare const five: string;
      export declare enum six {};
      export type { A };
      export { type B };
      `),
      []
    );
  });
});
