/**
 * @file utils/exporters.ts
 * @description Exporters: binary .bin (port of taw's gfpack) and Ruby .txt.
 */
import type { Formation, Arrangement } from '../types';
import { PURPOSE_TO_BITS, SHAPE_TO_INT } from '../constants/formations';
import { UNIT_CLASS_STR_TO_INT } from '../constants/units';

const SHAPE_LABELS: Record<Arrangement, string> = {
  Line:"line", Column:"column", CrescentFront:"crescent front", CrescentBack:"crescent back",
};

export function exportToRubyText(formations: Formation[]): string {
  return "[" + formations.map(f => {
    const pb = f.purposes.reduce((a,p) => a | (PURPOSE_TO_BITS[p] || 0), 0);
    const pl = f.purposes.join("/").toLowerCase() || "none";
    let s = `{:name=>"${f.name}",\n  :priority=>${f.priority.toFixed(1)},\n`;
    s += `  :purpose=>"${pb} (${pl})",\n`;
    s += `  :min_artillery=>${f.min_artillery}, :min_infantry=>${f.min_infantry}, :min_cavalry=>${f.min_cavalry},\n`;
    s += `  :factions=>[${f.factions.map(fc=>`"${fc}"`).join(", ")}],\n  :lines=>\n   [`;
    s += f.blocks.map(b => {
      if (b.type==="spanning") return `{:type=>:spanning, :blocks=>[${b.spannedBlocks.join(", ")}]}`;
      const si = SHAPE_TO_INT[b.arrangement] ?? 0;
      let bs = `{:type=>:${b.type}, :priority=>${b.blockPriority.toFixed(2)}`;
      if (b.type==="relative") bs += `, :relative_to=>${b.relativeToBlock}`;
      bs += `, :shape=>"${si} (${SHAPE_LABELS[b.arrangement]||"line"})"`;
      bs += `, :spacing=>${b.spacing.toFixed(1)}, :crescent_yoffset=>${b.crescentYOffset.toFixed(1)}`;
      bs += `, :x=>${b.x.toFixed(1)}, :y=>${b.y.toFixed(1)}`;
      bs += `, :min_threshold=>${b.minThreshold}, :max_threshold=>${b.maxThreshold}`;
      bs += `,\n     :pairs=>[`;
      bs += b.entities.map(e => {
        const ci = UNIT_CLASS_STR_TO_INT[e.description] ?? 0;
        return `{:priority=>${e.priority.toFixed(1)}, :unit_class=>"${ci} (${e.description})"}`;
      }).join(",\n            ");
      return bs + `]}`;
    }).join(",\n    ");
    return s + `]}`;
  }).join(",\n\n") + "]\n";
}

/** Port of taw's gfpack — writes groupformations.bin via DataView. */
export function exportToBinary(formations: Formation[]): ArrayBuffer {
  let buf = new ArrayBuffer(1024 * 256);
  let dv = new DataView(buf);
  let off = 0;
  const ensure = (n: number): void => {
    while (off + n > buf.byteLength) {
      const next = new ArrayBuffer(buf.byteLength * 2);
      new Uint8Array(next).set(new Uint8Array(buf));
      buf = next; dv = new DataView(buf);
    }
  };
  const wU4 = (v: number): void => { ensure(4); dv.setUint32(off,v,true); off+=4; };
  const wI4 = (v: number): void => { ensure(4); dv.setInt32(off,v,true); off+=4; };
  const wFlt = (v: number): void => { ensure(4); dv.setFloat32(off,v,true); off+=4; };
  const wStr = (s: string): void => {
    ensure(2+s.length*2); dv.setUint16(off,s.length,true); off+=2;
    for(let i=0;i<s.length;i++){ dv.setUint16(off,s.charCodeAt(i),true); off+=2; }
  };
  const wPairs = (entities: {priority:number;description:string}[]): void => {
    wU4(entities.length);
    entities.forEach(e=>{ wFlt(e.priority); wI4(UNIT_CLASS_STR_TO_INT[e.description]??0); });
  };
  const wLine = (b: Formation["blocks"][number]): void => {
    if(b.type==="absolute"){ wU4(0); wFlt(0.0); wFlt(b.blockPriority); wU4(SHAPE_TO_INT[b.arrangement]??0);
      wFlt(b.spacing); wFlt(b.crescentYOffset); wFlt(b.x); wFlt(b.y); wI4(b.minThreshold); wI4(b.maxThreshold); wPairs(b.entities||[]);
    } else if(b.type==="relative"){ wU4(1); wFlt(b.blockPriority); wU4(b.relativeToBlock); wU4(SHAPE_TO_INT[b.arrangement]??0);
      wFlt(b.spacing); wFlt(b.crescentYOffset); wFlt(b.x); wFlt(b.y); wI4(b.minThreshold); wI4(b.maxThreshold); wPairs(b.entities||[]);
    } else if(b.type==="spanning"){ wU4(3); wU4((b.spannedBlocks||[]).length); (b.spannedBlocks||[]).forEach(id=>wU4(id)); }
  };
  wU4(formations.length);
  formations.forEach(f=>{
    wStr(f.name); wFlt(f.priority);
    wU4(f.purposes.reduce((a,p)=>a|(PURPOSE_TO_BITS[p]||0),0));
    wU4(f.min_artillery); wU4(f.min_infantry); wU4(f.min_cavalry);
    wU4(f.factions.length); f.factions.forEach(fc=>wStr(fc));
    f.blocks.forEach((line,i)=>{ wU4(i===0?f.blocks.length:i); wLine(line); });
  });
  return buf.slice(0,off);
}
