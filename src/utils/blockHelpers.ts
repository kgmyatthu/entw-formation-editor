/**
 * @file utils/blockHelpers.ts
 * @description Helper functions for block rendering and creation.
 */
import type { Block, Formation, UnitCategory, EntityDescription } from '../types';
import { UNIT_COLORS, UNIT_CATEGORY_MAP } from '../constants/units';

/** Returns the fill color for a block based on its first entity preference. */
export function getBlockColor(block: Block): string {
  if (block.type === "spanning") return "transparent";
  const p = (block.entities || [])[0];
  return p ? (UNIT_COLORS[p.description] || "#6b7280") : "#6b7280";
}

/** Determines the military category of an entity description string. */
export function getEntityCategory(desc: EntityDescription): UnitCategory {
  if (UNIT_CATEGORY_MAP.infantry.includes(desc)) return "INF";
  if (UNIT_CATEGORY_MAP.cavalry.includes(desc)) return "CAV";
  if (UNIT_CATEGORY_MAP.artillery.includes(desc)) return "ART";
  if (UNIT_CATEGORY_MAP.naval.includes(desc)) return "NAV";
  if (UNIT_CATEGORY_MAP.command.includes(desc)) return "GEN";
  if (desc === "any") return "ANY";
  return "OTH";
}

/**
 * Computes a short label based on entity preference majority, weighted by priority.
 * Top category must be ≥60% for a definitive label, otherwise "MIX".
 */
export function getBlockLabel(block: Block): string {
  if (block.type === "spanning") return "Span";
  const ents = block.entities || [];
  if (ents.length === 0) return `B${block.id}`;

  const counts: Partial<Record<UnitCategory, number>> = {};
  ents.forEach(e => {
    const cat = getEntityCategory(e.description);
    counts[cat] = (counts[cat] || 0) + (e.priority > 0 ? e.priority : 0.1);
  });

  const keys = (Object.keys(counts) as UnitCategory[]).filter(k => k !== "ANY");
  if (keys.length === 0) return "ANY";
  keys.sort((a, b) => (counts[b] || 0) - (counts[a] || 0));
  const top = keys[0];
  const total = keys.reduce((s, k) => s + (counts[k] || 0), 0);
  if ((counts[top] || 0) / total >= 0.6) return top;
  return "MIX";
}

/** Creates a new default formation with anchor + general blocks. */
export function createDefaultFormation(): Formation {
  return {
    name: "New Formation", priority: 0, purposes: ["Attack", "Defend"],
    min_artillery: 0, min_infantry: 0, min_cavalry: 0, factions: [],
    blocks: [
      { id: 0, type: "absolute", blockPriority: 1.0, arrangement: "Line", spacing: 2.0, crescentYOffset: 0, x: 0, y: 0, minThreshold: 0, maxThreshold: -1, entities: [{ priority: 1.0, description: "infantry_line" }] },
      { id: 1, type: "relative", blockPriority: 0.5, arrangement: "Line", spacing: 2.0, crescentYOffset: 0, x: 0, y: -10, relativeToBlock: 0, minThreshold: 0, maxThreshold: -1, entities: [{ priority: 1.0, description: "general" }, { priority: 0.0, description: "any" }] },
    ],
  };
}
