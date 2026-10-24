"use strict";

const COLOR_HEX_BY_NAME = {
  "noir":"#111111","black":"#111111","blanc":"#FFFFFF","white":"#FFFFFF",
  "gris":"#8B919B","gray":"#8B919B","grey":"#8B919B","argent":"#C0C0C0","silver":"#C0C0C0",
  "bleu":"#2563EB","blue":"#2563EB","rouge":"#EF4444","red":"#EF4444","vert":"#16A34A","green":"#16A34A",
  "jaune":"#FACC15","yellow":"#FACC15","rose":"#EC4899","pink":"#EC4899","violet":"#8B5CF6","purple":"#8B5CF6",
  "orange":"#F97316","or":"#D4AF37","gold":"#D4AF37","marron":"#854D0E","brown":"#854D0E","beige":"#D6C6A5"
};

function normalizeProductColors(input) {
  let rows = input;
  if (rows === undefined || rows === null || rows === "") return [];
  if (typeof rows === "string") { try { rows = JSON.parse(rows); } catch (_) { return null; } }
  if (!Array.isArray(rows) || rows.length > 20) return null;
  const cleaned = []; const seen = new Set();
  for (const row of rows) {
    if (row == null) continue;
    const name = String(typeof row === "string" ? row : (row.name ?? row.label ?? "")).trim();
    if (!name) continue; if (name.length > 40) return null;
    const key = name.toLocaleLowerCase("fr"); if (seen.has(key)) continue;
    let hex = String(typeof row === "object" ? (row.hex ?? row.color ?? "") : "").trim();
    if (!hex) hex = COLOR_HEX_BY_NAME[key] || "#808080";
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return null;
    seen.add(key); cleaned.push({ name, hex: hex.toUpperCase() });
  }
  return cleaned;
}

function resolveSelectedProductColor(item, availableInput, productName) {
  const available = normalizeProductColors(availableInput);
  if (!Array.isArray(available)) throw new Error("La configuration des couleurs du produit est invalide.");
  const supplied = item && typeof item === "object" ? item.color : null;
  const requestedName = String((supplied && typeof supplied === "object" ? supplied.name : supplied) ?? item?.color_name ?? item?.colorName ?? "").trim();
  if (!available.length) {
    if (requestedName) throw new Error("La couleur sélectionnée pour " + productName + " n\u0027est plus disponible. Retire cet article du panier puis ajoute-le à nouveau.");
    return null;
  }
  if (!requestedName) throw new Error("Choisis une couleur pour " + productName + " avant de commander.");
  const match = available.find(color => color.name.toLocaleLowerCase("fr") === requestedName.toLocaleLowerCase("fr"));
  if (!match) throw new Error("La couleur « " + requestedName + " » n\u0027est plus disponible pour " + productName + ". Choisis une couleur proposée sur la fiche du produit.");
  return { name: match.name, hex: match.hex };
}

module.exports = { normalizeProductColors, resolveSelectedProductColor };