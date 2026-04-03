/**
 * @file constants/formations.ts
 * @description Formation-level constants: AI purposes, arrangements, shape mappings.
 */
import type { Purpose, Arrangement } from '../types';

export const ALL_PURPOSES: Purpose[] = ["Attack", "Defend", "River_Attack", "Naval_Attack", "Naval_Defend"];
export const ALL_ARRANGEMENTS: Arrangement[] = ["Line", "Column", "CrescentFront", "CrescentBack"];

/** Maps purpose name → bitmask value for the binary format. */
export const PURPOSE_TO_BITS: Record<Purpose, number> = {
  Attack: 1, Defend: 2, River_Attack: 4, Naval_Attack: 32, Naval_Defend: 64,
};

/** Maps arrangement string → integer for the binary shape field. */
export const SHAPE_TO_INT: Record<Arrangement, number> = { Line: 0, Column: 1, CrescentFront: 2, CrescentBack: 3 };

/** Maps integer shape → arrangement string. */
export const INT_TO_SHAPE: Record<number, Arrangement> = { 0: "Line", 1: "Column", 2: "CrescentFront", 3: "CrescentBack" };
