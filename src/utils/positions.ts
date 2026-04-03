/**
 * @file utils/positions.ts
 * @description Computes absolute canvas positions from the game's relative offset system.
 */
import type { Block, BlockPosition, PositionMap } from '../types';

/** Base block thickness in canvas units (before scaling). */
export const BASE_H = 1.8;

/** Rounds a float to at most 2 decimal places. */
export const r2 = (v: number): number => Math.round(v * 100) / 100;

/**
 * Computes the visual width (length along arrangement axis) of a block.
 * Width scales proportionally with maxThreshold.
 */
export function getBlockGameW(b: Block | null, blockScale: number = 0.3): number {
  const bw = BASE_H * 1.9 * blockScale;
  if (!b || b.type === "spanning") return bw;
  const mt = b.maxThreshold;
  if (mt <= 0 || mt === 1) return bw;
  return bw * mt;
}

/**
 * Computes the visual height (thickness perpendicular to arrangement).
 */
export function getBlockGameH(blockThickness: number = 1.0): number {
  return BASE_H * blockThickness;
}

/**
 * Computes absolute canvas positions for all blocks in a formation.
 * Uses simple center-to-center additive offsets.
 */
export function computeAbsolutePositions(
  blocks: Block[],
  posScaleX: number = 0.5,
  posScaleY: number = 0.15,
  blockScale: number = 0.7,
  blockThickness: number = 1.0
): PositionMap {
  const positions: PositionMap = {};
  const blockMap: Record<number, Block> = {};
  blocks.forEach(b => { blockMap[b.id] = b; });
  const bh = getBlockGameH(blockThickness);
  const defaultW = BASE_H * 1.9 * blockScale;

  function getPos(blockId: number): BlockPosition {
    if (positions[blockId] !== undefined) return positions[blockId];
    const b = blockMap[blockId];
    if (!b) return { ax: 0, ay: 0, w: defaultW, h: bh };

    if (b.type === "absolute") {
      positions[blockId] = { ax: b.x * posScaleX, ay: b.y * posScaleY, w: getBlockGameW(b, blockScale), h: bh };
    } else if (b.type === "relative") {
      const parent = getPos(b.relativeToBlock);
      positions[blockId] = {
        ax: parent.ax + b.x * posScaleX,
        ay: parent.ay + b.y * posScaleY,
        w: getBlockGameW(b, blockScale),
        h: bh,
      };
    } else if (b.type === "spanning") {
      const children = (b.spannedBlocks || []).map(sid => getPos(sid)).filter(Boolean);
      if (children.length === 0) {
        positions[blockId] = { ax: 0, ay: 0, w: defaultW, h: bh };
      } else {
        const minX = Math.min(...children.map(c => c.ax - c.w / 2));
        const maxX = Math.max(...children.map(c => c.ax + c.w / 2));
        const minY = Math.min(...children.map(c => c.ay - c.h / 2));
        const maxY = Math.max(...children.map(c => c.ay + c.h / 2));
        positions[blockId] = { ax: (minX + maxX) / 2, ay: (minY + maxY) / 2, w: maxX - minX, h: maxY - minY };
      }
    }
    return positions[blockId] || { ax: 0, ay: 0, w: defaultW, h: bh };
  }

  blocks.forEach(b => getPos(b.id));
  return positions;
}
