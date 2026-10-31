"use strict";

/**
 * Normalize product characteristic rows accepted by the admin create/edit APIs.
 * Returns null for invalid input; returns a clean array for valid input.
 */
function normalizeProductCharacteristics(input) {
  let rows = input;
  if (rows === undefined || rows === null) return [];
  if (typeof rows === "string") {
    try { rows = JSON.parse(rows); } catch (_) { return null; }
  }
  if (!Array.isArray(rows) || rows.length > 30) return null;

  const cleaned = [];
  for (const row of rows) {
    if (!row || typeof row !== "object" || Array.isArray(row)) return null;
    const name = String(row.name ?? "").trim();
    const value = String(row.value ?? "").trim();
    if (!name && !value) continue;
    if (!name || !value || name.length > 80 || value.length > 300) return null;
    cleaned.push({ name, value });
  }
  return cleaned;
}

module.exports = { normalizeProductCharacteristics };
