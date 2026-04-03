/**
 * @file constants/units.ts
 * @description Unit type definitions for Napoleon Total War groupformations.
 */
import type { EntityDescription, UnitCategoryKey } from '../types';

/** Color hex values for each unit entity type. */
export const UNIT_COLORS: Record<EntityDescription, string> = {
  infantry_elite: "#2563eb", infantry_grenadiers: "#3b82f6", infantry_line: "#60a5fa",
  infantry_melee: "#7dd3fc", infantry_berserker: "#1e40af", infantry_militia: "#93c5fd",
  infantry_mob: "#bfdbfe", infantry_light: "#14b8a6", infantry_skirmishers: "#22c55e",
  infantry_irregulars: "#84cc16", cavalry_heavy: "#dc2626", cavalry_standard: "#ef4444",
  cavalry_lancers: "#f87171", cavalry_camels: "#f97316", cavalry_light: "#fb923c",
  cavalry_irregular: "#fdba74", cavalry_missile: "#eab308", dragoons: "#d97706",
  elephants: "#92400e", artillery_fixed: "#fbbf24", artillery_foot: "#fcd34d",
  artillery_horse: "#fde68a", general: "#a855f7", any: "#6b7280",
  naval_over_first_rate: "#0ea5e9", naval_first_rate: "#0284c7", naval_second_rate: "#0369a1",
  naval_third_rate: "#075985", naval_fourth_rate: "#0c4a6e", naval_fifth_rate: "#155e75",
  naval_sixth_rate: "#164e63", naval_galleon: "#0e7490", naval_razee: "#06b6d4",
  naval_brig: "#22d3ee", naval_sloop: "#67e8f9", naval_bomb_ketch: "#a5f3fc",
  naval_rocket_ship: "#cffafe", naval_indiaman: "#5eead4", naval_lugger: "#99f6e4",
  naval_dhow: "#ccfbf1", naval_steam_ship: "#2dd4bf", naval_admiral: "#7c3aed",
  naval_heavy_galley: "#0891b2", naval_medium_galley: "#06b6d4", naval_light_galley: "#22d3ee",
  naval_xebec: "#14b8a6",
};

/** Unit types grouped by military category. */
export const UNIT_CATEGORY_MAP: Record<UnitCategoryKey, string[]> = {
  infantry: [
    "infantry_elite", "infantry_grenadiers", "infantry_line", "infantry_melee",
    "infantry_berserker", "infantry_militia", "infantry_mob", "infantry_light",
    "infantry_skirmishers", "infantry_irregulars",
  ],
  cavalry: [
    "cavalry_heavy", "cavalry_standard", "cavalry_lancers", "cavalry_camels",
    "cavalry_light", "cavalry_irregular", "cavalry_missile", "dragoons", "elephants",
  ],
  artillery: ["artillery_fixed", "artillery_foot", "artillery_horse"],
  command: ["general"],
  naval: Object.keys(UNIT_COLORS).filter(k => k.startsWith("naval_")),
  other: ["any"],
};

/** Flat list of all non-naval entity types. */
export const ALL_ENTITY_TYPES: string[] = [
  ...UNIT_CATEGORY_MAP.infantry, ...UNIT_CATEGORY_MAP.cavalry,
  ...UNIT_CATEGORY_MAP.artillery, ...UNIT_CATEGORY_MAP.command,
  ...UNIT_CATEGORY_MAP.other,
];

/** Unit class string → integer index (taw's alphabetical ordering). */
export const UNIT_CLASS_STR_TO_INT: Record<string, number> = {
  artillery_fixed: 0, artillery_foot: 1, artillery_horse: 2,
  cavalry_camels: 3, cavalry_heavy: 4, cavalry_irregular: 5,
  cavalry_lancers: 6, cavalry_light: 7, cavalry_missile: 8,
  cavalry_standard: 9, dragoons: 10, elephants: 11, general: 12,
  infantry_berserker: 13, infantry_elite: 14, infantry_grenadiers: 15,
  infantry_irregulars: 16, infantry_light: 17, infantry_line: 18,
  infantry_melee: 19, infantry_militia: 20, infantry_mob: 21,
  infantry_skirmishers: 22,
  naval_admiral: 23, naval_bomb_ketch: 24, naval_brig: 25,
  naval_dhow: 26, naval_fifth_rate: 27, naval_first_rate: 28,
  naval_fourth_rate: 29, naval_galleon: 30, naval_heavy_galley: 31,
  naval_indiaman: 32, naval_light_galley: 33, naval_lugger: 34,
  naval_medium_galley: 35, naval_over_first_rate: 36, naval_razee: 37,
  naval_rocket_ship: 38, naval_second_rate: 39, naval_sixth_rate: 40,
  naval_sloop: 41, naval_steam_ship: 42, naval_third_rate: 43,
  naval_xebec: 44, any: 46,
};

/** Reverse mapping: integer → unit class string. */
export const UNIT_CLASS_INT_TO_STR: Record<number, string> = Object.fromEntries(
  Object.entries(UNIT_CLASS_STR_TO_INT).map(([k, v]) => [v, k])
);
