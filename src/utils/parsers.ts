/**
 * @file utils/parsers.ts
 * @description Parsers for NTW GroupFormation data: binary .bin and Ruby .txt.
 */
import type { Formation, Block, RubyRawFormation, RubyRawBlock, Purpose } from '../types';
import { PURPOSE_TO_BITS, INT_TO_SHAPE } from '../constants/formations';
import { UNIT_CLASS_INT_TO_STR } from '../constants/units';

function rubyFormationToInternal(rf: RubyRawFormation): Formation {
  const purposeInt = parseInt(String(rf.purpose)) || 0;
  const purposes: Purpose[] = [];
  (Object.entries(PURPOSE_TO_BITS) as [Purpose, number][]).forEach(([name, bit]) => {
    if (purposeInt & bit) purposes.push(name);
  });
  return {
    name: rf.name, priority: rf.priority || 0, purposes,
    min_artillery: rf.min_artillery || 0, min_infantry: rf.min_infantry || 0, min_cavalry: rf.min_cavalry || 0,
    factions: rf.factions || [],
    blocks: (rf.lines || []).map((line: RubyRawBlock, i: number): Block => {
      if (line.type === "spanning") return { id: i, type: "spanning", spannedBlocks: line.blocks || [] };
      const shapeInt = parseInt(String(line.shape)) || 0;
      return {
        id: i, type: line.type as "absolute" | "relative",
        blockPriority: line.priority || 0, arrangement: INT_TO_SHAPE[shapeInt] || "Line",
        spacing: line.spacing || 2, crescentYOffset: line.crescent_yoffset || 0,
        x: line.x || 0, y: line.y || 0,
        minThreshold: line.min_threshold || 0, maxThreshold: line.max_threshold ?? -1,
        relativeToBlock: line.relative_to ?? 0,
        entities: (line.pairs || []).map(p => {
          const classInt = parseInt(String(p.unit_class)) || 0;
          return { priority: p.priority, description: UNIT_CLASS_INT_TO_STR[classInt] || `unknown_${classInt}` };
        }),
      } as Block;
    }),
  };
}

export function parseRubyText(text: string): Formation[] {
  try {
    let json = text.trim();
    json = json.replace(/([{\[,\n])\s*(\w+):\s/g, (_m: string, prefix: string, key: string) => `${prefix} "${key}": `);
    json = json.replace(/^\s*(\w+):\s/gm, ' "$1": ');
    json = json.replace(/:(\w+)\s*=>\s*/g, '"$1": ');
    json = json.replace(/:\s+:(\w+)/g, ': "$1"');
    json = json.replace(/([,\[])\s*:(\w+)/g, '$1 "$2"');
    json = json.replace(/\bnil\b/g, 'null');
    json = json.replace(/,(\s*[\]\}])/g, '$1');
    const raw: RubyRawFormation[] = JSON.parse(json);
    return raw.map(f => rubyFormationToInternal(f));
  } catch (e) {
    throw new Error("Failed to parse Ruby text: " + (e instanceof Error ? e.message : String(e)));
  }
}

/** Port of taw's gfunpack — reads groupformations.bin via DataView. */
export function parseBinary(buffer: ArrayBuffer): Formation[] {
  const dv = new DataView(buffer);
  let off = 0;
  const u4 = (): number => { const v = dv.getUint32(off, true); off += 4; return v; };
  const i4 = (): number => { const v = dv.getInt32(off, true); off += 4; return v; };
  const flt = (): number => { const v = dv.getFloat32(off, true); off += 4; return v; };
  const str = (): string => {
    const n = dv.getUint16(off, true); off += 2;
    let s = ""; for (let i = 0; i < n; i++) { s += String.fromCharCode(dv.getUint16(off, true)); off += 2; }
    return s;
  };
  const readPairs = (): { priority: number; description: string }[] => {
    const c = u4(); const p: { priority: number; description: string }[] = [];
    for (let i = 0; i < c; i++) { const pr = flt(); const ci = i4(); p.push({ priority: pr, description: UNIT_CLASS_INT_TO_STR[ci] || `unknown_${ci}` }); }
    return p;
  };
  const readLine = (id: number): Block => {
    const t = u4();
    if (t === 0) { flt(); const pr=flt(); const sh=u4(); const sp=flt(); const cy=flt(); const x=flt(); const y=flt(); const mn=i4(); const mx=i4();
      return { id, type:"absolute", blockPriority:pr, arrangement:INT_TO_SHAPE[sh]||"Line", spacing:sp, crescentYOffset:cy, x, y, minThreshold:mn, maxThreshold:mx, entities:readPairs() };
    } else if (t === 1) { const pr=flt(); const rel=u4(); const sh=u4(); const sp=flt(); const cy=flt(); const x=flt(); const y=flt(); const mn=i4(); const mx=i4();
      return { id, type:"relative", blockPriority:pr, relativeToBlock:rel, arrangement:INT_TO_SHAPE[sh]||"Line", spacing:sp, crescentYOffset:cy, x, y, minThreshold:mn, maxThreshold:mx, entities:readPairs() };
    } else if (t === 3) { const c=u4(); const sb: number[]=[]; for(let i=0;i<c;i++) sb.push(u4()); return { id, type:"spanning", spannedBlocks:sb };
    } else throw new Error(`Unknown line type ${t} at offset ${off-4}`);
  };
  const readFormation = (): Formation => {
    const name=str(); const priority=flt(); const pi=u4();
    const purposes: Purpose[] = [];
    (Object.entries(PURPOSE_TO_BITS) as [Purpose,number][]).forEach(([n,bit])=>{ if(pi&bit) purposes.push(n); });
    const ma=u4(); const mi=u4(); const mc=u4(); const fc=u4(); const factions:string[]=[]; for(let i=0;i<fc;i++) factions.push(str());
    const lc=u4(); const blocks:Block[]=[]; blocks.push(readLine(0));
    for(let i=1;i<lc;i++){ u4(); blocks.push(readLine(i)); }
    return { name, priority, purposes, min_artillery:ma, min_infantry:mi, min_cavalry:mc, factions, blocks };
  };
  const fc = u4(); const formations:Formation[] = [];
  for(let i=0;i<fc;i++) formations.push(readFormation());
  return formations;
}
