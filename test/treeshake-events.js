import assert from "node:assert";
import { transform } from "@swc/core";
import { describe, it } from "node:test";

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

describe("@swwind/treeshake-events", () => {
  it("should work out of box", async () => {
    const { code } = await transform(
      `
      import { jsx as _jsx } from "preact/jsx-runtime";
      _jsx("div", { onClick: () => {} });
      `,
      {
        jsc: {
          parser: {
            syntax: "ecmascript",
            jsx: false,
          },
          experimental: {
            plugins: [["@swwind/treeshake-events", {}]],
          },
          target: "esnext",
        },
      }
    );
    return assertEquals(
      code,
      `
      import { jsx as _jsx } from "preact/jsx-runtime";
      _jsx("div", {});
      `
    );
  });

  it("should work for personalize", async () => {
    const { code } = await transform(
      `
      import { sponge_bob_square_pants as patrick_star } from "preact/jsx-runtime";
      patrick_star("div", {
        wooooooooooo: () => alert('who lives in a pineapple under the see?'),
        sponge_bob_square_pants: true,
      });
      `,
      {
        jsc: {
          parser: {
            syntax: "ecmascript",
            jsx: false,
          },
          experimental: {
            plugins: [
              [
                "@swwind/treeshake-events",
                {
                  jsxs: ["sponge_bob_square_pants"],
                  matches: ["o{5,}"],
                },
              ],
            ],
          },
          target: "esnext",
        },
      }
    );
    return assertEquals(
      code,
      `
      import { sponge_bob_square_pants as patrick_star } from "preact/jsx-runtime";
      patrick_star("div", {
        sponge_bob_square_pants: true
      });
      `
    );
  });
});
