const assert = require("assert");
const { normalizeProductCharacteristics } = require("./product-validation");

assert.deepStrictEqual(normalizeProductCharacteristics(undefined), []);
assert.deepStrictEqual(
  normalizeProductCharacteristics([{ name: "  Écran ", value: "  6,7 pouces " }]),
  [{ name: "Écran", value: "6,7 pouces" }]
);
assert.deepStrictEqual(
  normalizeProductCharacteristics('[{"name":"RAM","value":"8 Go"}]'),
  [{ name: "RAM", value: "8 Go" }]
);
assert.deepStrictEqual(
  normalizeProductCharacteristics([{ name: "", value: "" }]),
  []
);
assert.strictEqual(normalizeProductCharacteristics("not-json"), null);
assert.strictEqual(normalizeProductCharacteristics([{ name: "Écran", value: "" }]), null);
assert.strictEqual(normalizeProductCharacteristics([{ name: "x".repeat(81), value: "ok" }]), null);
assert.strictEqual(normalizeProductCharacteristics([{ name: "ok", value: "x".repeat(301) }]), null);
assert.strictEqual(normalizeProductCharacteristics(Array.from({ length: 31 }, (_, i) => ({ name: String(i), value: "v" }))), null);
assert.strictEqual(normalizeProductCharacteristics(["not-an-object"]), null);

console.log("product-validation smoke test: OK");
