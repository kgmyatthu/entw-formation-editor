/**
 * @file components/FormationCanvas.tsx
 * @description Interactive 2D SVG canvas for visualizing and editing formation block layouts.
 */
import { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import type { FormationCanvasProps, ViewState, DragState, PanState, Block, BlockPosition, AbsoluteBlock, RelativeBlock } from '../types';
import { computeAbsolutePositions, getBlockGameW, getBlockGameH, BASE_H, r2 } from '../utils/positions';
import { getBlockColor, getBlockLabel } from '../utils/blockHelpers';
import { UNIT_COLORS } from '../constants/units';
import S from '../constants/styles';

export default function FormationCanvas({
  formation, selectedBlockId, selectedBlockIds, onSelectBlock, onUpdateBlock,
  posScaleX, posScaleY, blockScale, blockThickness,
}: FormationCanvasProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const viewRef = useRef<ViewState>({ x: 0, y: 0, scale: 8 });
  const [viewTick, setViewTick] = useState<number>(0);
  const dragRef = useRef<DragState | null>(null);
  const panRef = useRef<PanState | null>(null);
  const view = viewRef.current;
  const SNAP = 1;

  const commitView = useCallback((nv: ViewState): void => {
    viewRef.current = nv;
    setViewTick(t => t + 1);
  }, []);

  useEffect(() => {
    if (!formation) return;
    const pos = computeAbsolutePositions(formation.blocks, posScaleX, posScaleY, blockScale, blockThickness);
    const vals = Object.values(pos);
    if (vals.length === 0) return;
    const cx = vals.reduce((s, p) => s + p.ax, 0) / vals.length;
    const cy = vals.reduce((s, p) => s + p.ay, 0) / vals.length;
    const isNaval = formation.blocks.some(b => b.type !== "spanning" && (b as AbsoluteBlock | RelativeBlock).entities.some(e => e.description.startsWith("naval_")));
    commitView({ x: -cx, y: cy, scale: isNaval ? 1.5 : 8 });
  }, [formation?.name, commitView, posScaleX, posScaleY, blockScale, blockThickness]);

  const positions = useMemo(
    () => formation ? computeAbsolutePositions(formation.blocks, posScaleX, posScaleY, blockScale, blockThickness) : {},
    [formation, posScaleX, posScaleY, blockScale, blockThickness]
  );

  const toScreen = useCallback((gx: number, gy: number): { sx: number; sy: number } => {
    const el = svgRef.current;
    if (!el) return { sx: 0, sy: 0 };
    const r = el.getBoundingClientRect();
    const v = viewRef.current;
    return { sx: r.width / 2 + (gx + v.x) * v.scale, sy: r.height / 2 - (gy + v.y) * v.scale };
  }, [viewTick]); // eslint-disable-line react-hooks/exhaustive-deps

  const toGame = useCallback((sx: number, sy: number): { gx: number; gy: number } => {
    const el = svgRef.current;
    if (!el) return { gx: 0, gy: 0 };
    const r = el.getBoundingClientRect();
    const v = viewRef.current;
    return { gx: (sx - r.width / 2) / v.scale - v.x, gy: -(sy - r.height / 2) / v.scale - v.y };
  }, [viewTick]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleWheel = useCallback((e: React.WheelEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    const v = viewRef.current;
    const factor = e.deltaY > 0 ? 0.88 : 1.12;
    commitView({ ...v, scale: Math.max(0.3, Math.min(40, v.scale * factor)) });
  }, [commitView]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent): void => {
    if (e.button === 0) {
      e.preventDefault();
      const v = viewRef.current;
      panRef.current = { startX: e.clientX, startY: e.clientY, origX: v.x, origY: v.y };
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent): void => {
    const drag = dragRef.current;
    const pan = panRef.current;
    if (drag && svgRef.current && formation) {
      const r = svgRef.current.getBoundingClientRect();
      const { gx, gy } = toGame(e.clientX - r.left, e.clientY - r.top);
      const block = formation.blocks.find(b => b.id === drag.blockId);
      if (!block || block.type === "spanning") return;
      const targetAx = gx + drag.offsetX;
      const targetAy = gy + drag.offsetY;
      if (block.type === "absolute") {
        onUpdateBlock(drag.blockId, {
          x: Math.round(targetAx / posScaleX / SNAP) * SNAP,
          y: Math.round(targetAy / posScaleY / SNAP) * SNAP,
        });
      } else {
        const pp: BlockPosition = drag.parentPos || { ax: 0, ay: 0, w: 0, h: 0 };
        onUpdateBlock(drag.blockId, {
          x: Math.round((targetAx - pp.ax) / posScaleX / SNAP) * SNAP,
          y: Math.round((targetAy - pp.ay) / posScaleY / SNAP) * SNAP,
        });
      }
    } else if (pan) {
      const v = viewRef.current;
      const dx = e.clientX - pan.startX;
      const dy = e.clientY - pan.startY;
      commitView({ ...v, x: pan.origX + dx / v.scale, y: pan.origY - dy / v.scale });
    }
  }, [formation, onUpdateBlock, toGame, commitView, posScaleX, posScaleY, blockScale, blockThickness]);

  const handleMouseUp = useCallback((): void => {
    dragRef.current = null;
    panRef.current = null;
    setViewTick(t => t + 1);
  }, []);

  if (!formation) return (
    <div style={{ ...S.canvas, display: "flex", alignItems: "center", justifyContent: "center", cursor: "default" }}>
      <div style={{ color: "#555", fontSize: 18 }}>Import or create a formation to begin</div>
    </div>
  );

  const startBlockDrag = (b: Block, e: React.MouseEvent): void => {
    if (e.ctrlKey || e.metaKey) return;
    const r = svgRef.current!.getBoundingClientRect();
    const grabGame = toGame(e.clientX - r.left, e.clientY - r.top);
    const blockPos = positions[b.id] || { ax: 0, ay: 0, w: 0, h: 0 };
    const parentId = b.type === "relative" ? b.relativeToBlock : null;
    const parentPos: BlockPosition | null = parentId != null
      ? (positions[parentId] || { ax: 0, ay: 0, w: BASE_H * 1.9 * blockScale, h: getBlockGameH(blockThickness) })
      : null;
    dragRef.current = { blockId: b.id, offsetX: blockPos.ax - grabGame.gx, offsetY: blockPos.ay - grabGame.gy, parentPos };
    panRef.current = null;
  };

  return (
    <div ref={containerRef} style={{ ...S.canvas, cursor: dragRef.current ? "grabbing" : "grab" }} onWheel={handleWheel}>
      <div style={{ position: "absolute", top: 12, left: 14, zIndex: 10, fontSize: 13, color: "#556", pointerEvents: "none" }}>
        Drag: pan · Scroll: zoom · Click block: select · Drag block: move
      </div>
      <div style={{ position: "absolute", top: 12, right: 14, zIndex: 10, fontSize: 13, color: "#556" }}>Zoom: {view.scale.toFixed(1)}x</div>
      <div style={{ position: "absolute", bottom: 12, left: 14, zIndex: 10, display: "flex", gap: 10, flexWrap: "wrap", maxWidth: 520 }}>
        {(["infantry_line", "cavalry_heavy", "artillery_foot", "infantry_light", "general", "any"] as const).map(t => (
          <span key={t} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#999" }}>
            <span style={S.badge(UNIT_COLORS[t])} />{t.replace(/_/g, " ")}
          </span>
        ))}
      </div>
      <div style={{ position: "absolute", top: 36, left: "50%", transform: "translateX(-50%)", zIndex: 10, fontSize: 13, color: "#e94560", letterSpacing: 2, textTransform: "uppercase", pointerEvents: "none", fontWeight: 700 }}>
        ▲ ENEMY / FORWARD (+Y)
      </div>
      <svg ref={svgRef} width="100%" height="100%" style={{ display: "block" }}
        onMouseDown={handleCanvasMouseDown} onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
        <defs>
          <filter id="selectedGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0.914  0 0 0 0 0.271  0 0 0 0 0.376  0 0 0 0.7 0" result="colorBlur" />
            <feMerge><feMergeNode in="colorBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Grid */}
        {(() => {
          const el = svgRef.current;
          if (!el) return null;
          const rc = el.getBoundingClientRect();
          const w = rc.width || 800, h = rc.height || 600;
          const gridStep = view.scale >= 4 ? 5 : view.scale >= 1 ? 25 : 75;
          const lines: JSX.Element[] = [];
          const cx = w / 2 + view.x * view.scale;
          const cy = h / 2 - view.y * view.scale;
          const gp = gridStep * view.scale;
          if (gp > 8) {
            for (let x = ((cx % gp) + gp) % gp; x < w; x += gp)
              lines.push(<line key={`gv${x.toFixed(1)}`} x1={x} y1={0} x2={x} y2={h} stroke="#1a1a30" strokeWidth={1} />);
            for (let y = ((cy % gp) + gp) % gp; y < h; y += gp)
              lines.push(<line key={`gh${y.toFixed(1)}`} x1={0} y1={y} x2={w} y2={y} stroke="#1a1a30" strokeWidth={1} />);
          }
          lines.push(<line key="ax" x1={cx} y1={0} x2={cx} y2={h} stroke="#2a2a5a" strokeWidth={1.5} />);
          lines.push(<line key="ay" x1={0} y1={cy} x2={w} y2={cy} stroke="#2a2a5a" strokeWidth={1.5} />);
          return lines;
        })()}

        {/* Connection lines */}
        {formation.blocks.filter((b): b is Extract<Block, { type: "relative" }> => b.type === "relative").map(b => {
          const pos = positions[b.id]; const pp = positions[b.relativeToBlock];
          if (!pos || !pp) return null;
          const from = toScreen(pos.ax, pos.ay); const to = toScreen(pp.ax, pp.ay);
          return <line key={`c-${b.id}`} x1={from.sx} y1={from.sy} x2={to.sx} y2={to.sy} stroke="#3a3a6a" strokeWidth={1.5} strokeDasharray="5,4" opacity={0.5} />;
        })}

        {/* Spanning bounding boxes */}
        {formation.blocks.filter((b): b is Extract<Block, { type: "spanning" }> => b.type === "spanning").map(b => {
          const cp = b.spannedBlocks.map(s => positions[s]).filter(Boolean);
          if (cp.length === 0) return null;
          const pad = 2.5;
          const tl = toScreen(Math.min(...cp.map(p => p.ax - (p.w || BASE_H * 1.9 * blockScale) / 2)) - pad, Math.max(...cp.map(p => p.ay + (p.h || BASE_H * blockThickness) / 2)) + pad);
          const br = toScreen(Math.max(...cp.map(p => p.ax + (p.w || BASE_H * 1.9 * blockScale) / 2)) + pad, Math.min(...cp.map(p => p.ay - (p.h || BASE_H * blockThickness) / 2)) - pad);
          const sel = selectedBlockId === b.id || selectedBlockIds.has(b.id);
          return <rect key={`sp-${b.id}`} x={tl.sx} y={tl.sy} width={br.sx - tl.sx} height={br.sy - tl.sy}
            fill="none" stroke={sel ? "#e94560" : "#4a4a7a"} strokeWidth={sel ? 2.5 : 1.5} strokeDasharray="8,5" rx={5}
            filter={sel ? "url(#selectedGlow)" : undefined} />;
        })}

        {/* Block rectangles */}
        {formation.blocks.filter((b): b is AbsoluteBlock | RelativeBlock => b.type !== "spanning").map(b => {
          const pos = positions[b.id]; if (!pos) return null;
          const center = toScreen(pos.ax, pos.ay);
          const gameW = getBlockGameW(b, blockScale);
          const gameH = getBlockGameH(blockThickness);
          const arr = b.arrangement;
          const isColumn = arr === "Column";
          const isCrescent = arr === "CrescentFront" || arr === "CrescentBack";
          const w = isColumn ? gameH * view.scale : gameW * view.scale;
          const h = isColumn ? gameW * view.scale : gameH * view.scale;
          const color = getBlockColor(b);
          const sel = selectedBlockId === b.id;
          const highlighted = sel || selectedBlockIds.has(b.id);
          const label = getBlockLabel(b).toUpperCase();
          const ents = b.entities;
          const dotR = Math.min(Math.max(view.scale * 0.22, 1.5), 4);
          const dotGap = dotR * 2.4;
          const maxDotsPerRow = Math.max(1, Math.floor((w - 4) / dotGap));
          const dotsBaseY = center.sy + h * 0.18;
          const headerFs = Math.min(10, Math.max(6, view.scale * 0.7));
          const infoFs = Math.min(11, Math.max(7, view.scale * 0.8));

          return (
            <g key={`b-${b.id}`} style={{ cursor: dragRef.current?.blockId === b.id ? "grabbing" : "pointer" }}
              onMouseDown={e => { if (e.button === 0) { e.stopPropagation(); e.preventDefault(); onSelectBlock(b.id, e); startBlockDrag(b, e); } }}>
              <text x={center.sx} y={center.sy - h / 2 - 3} textAnchor="middle" fill={highlighted ? "#e94560" : "#ccc"}
                fontSize={headerFs} fontFamily="inherit" fontWeight={700} letterSpacing="0.5" style={{ pointerEvents: "none" }}>
                #{b.id} {label}{b.type === "absolute" ? " ⚓" : ""}
              </text>
              {isCrescent ? (() => {
                const cx2 = center.sx, cy2 = center.sy, hw = w / 2, hh = h / 2;
                const curve = h * 0.4 * (arr === "CrescentFront" ? -1 : 1);
                const d = `M${cx2 - hw},${cy2 - hh} Q${cx2},${cy2 - hh + curve} ${cx2 + hw},${cy2 - hh} L${cx2 + hw},${cy2 + hh} Q${cx2},${cy2 + hh + curve} ${cx2 - hw},${cy2 + hh} Z`;
                return <path d={d} fill={color} stroke={highlighted ? "#fff" : "rgba(0,0,0,.5)"} strokeWidth={highlighted ? 2 : 1} filter={highlighted ? "url(#selectedGlow)" : undefined} />;
              })() : (
                <rect x={center.sx - w / 2} y={center.sy - h / 2} width={w} height={h} fill={color} stroke={highlighted ? "#fff" : "rgba(0,0,0,.5)"} strokeWidth={highlighted ? 2 : 1} rx={3} filter={highlighted ? "url(#selectedGlow)" : undefined} />
              )}
              {highlighted && <rect x={center.sx - w / 2 - 3} y={center.sy - h / 2 - 3} width={w + 6} height={h + 6}
                fill="none" stroke={sel ? "#e94560" : "#f59e0b"} strokeWidth={1.5} rx={5} opacity={0.9} strokeDasharray={sel ? "none" : "4,3"} />}
              {isColumn && <text x={center.sx + w / 2 + 3} y={center.sy - h / 2 + headerFs} fill="#888" fontSize={headerFs * 0.8} fontFamily="inherit" style={{ pointerEvents: "none" }}>↕</text>}
              {isCrescent && <text x={center.sx + w / 2 + 3} y={center.sy - h / 2 + headerFs} fill="#888" fontSize={headerFs * 0.8} fontFamily="inherit" style={{ pointerEvents: "none" }}>{arr === "CrescentFront" ? "⌢" : "⌣"}</text>}
              {b.maxThreshold > 0 && w > 16 && (
                <text x={center.sx + w / 2 - 2} y={center.sy - h / 2 + infoFs + 1} textAnchor="end" fill="rgba(255,255,255,0.8)" fontSize={infoFs} fontFamily="inherit" fontWeight={600} style={{ pointerEvents: "none" }}>×{b.maxThreshold}</text>
              )}
              {ents.slice(0, maxDotsPerRow * 3).map((ent, ei) => {
                const row = Math.floor(ei / maxDotsPerRow); const col = ei % maxDotsPerRow;
                const rowCount = Math.min(ents.length - row * maxDotsPerRow, maxDotsPerRow);
                const rowW = rowCount * dotGap;
                const sx = center.sx - rowW / 2 + dotGap / 2 + col * dotGap;
                const sy = dotsBaseY + row * (dotR * 2.2);
                const dotColor = UNIT_COLORS[ent.description] || "#888";
                return (<g key={ei}><circle cx={sx} cy={sy} r={dotR} fill={dotColor} stroke="rgba(0,0,0,0.5)" strokeWidth={0.8} />{ent.priority < 0.5 && <circle cx={sx} cy={sy} r={dotR} fill="rgba(0,0,0,0.4)" />}</g>);
              })}
              {view.scale > 3 && (
                <text x={center.sx} y={center.sy + h / 2 + infoFs + 3} textAnchor="middle" fill="#8899aa" fontSize={infoFs} fontFamily="inherit" fontWeight={500} style={{ pointerEvents: "none" }}>
                  pos({r2(b.x)}, {r2(b.y)}){b.type === "relative" ? ` → rel:#${b.relativeToBlock}` : ""}
                </text>
              )}
              {view.scale > 3 && (
                <text x={center.sx} y={center.sy + h / 2 + infoFs * 2 + 6} textAnchor="middle" fill="#778899" fontSize={infoFs} fontFamily="inherit" fontWeight={500} style={{ pointerEvents: "none" }}>
                  {b.arrangement.toLowerCase()} pri:{r2(b.blockPriority)}
                </text>
              )}
            </g>
          );
        })}

        {/* Spanning click targets */}
        {formation.blocks.filter((b): b is Extract<Block, { type: "spanning" }> => b.type === "spanning").map(b => {
          const cp = b.spannedBlocks.map(s => positions[s]).filter(Boolean);
          if (cp.length === 0) return null;
          const pad = 2.5;
          const tl = toScreen(Math.min(...cp.map(p => p.ax - (p.w || BASE_H * 1.9 * blockScale) / 2)) - pad, Math.max(...cp.map(p => p.ay + (p.h || BASE_H * blockThickness) / 2)) + pad);
          const br = toScreen(Math.max(...cp.map(p => p.ax + (p.w || BASE_H * 1.9 * blockScale) / 2)) + pad, Math.min(...cp.map(p => p.ay - (p.h || BASE_H * blockThickness) / 2)) - pad);
          const w = br.sx - tl.sx, h = br.sy - tl.sy;
          if (w <= 0 || h <= 0) return null;
          const cs = Math.min(16, w * 0.15, h * 0.15);
          const bSel = selectedBlockId === b.id || selectedBlockIds.has(b.id);
          return (
            <g key={`sp-click-${b.id}`} style={{ cursor: "pointer" }} onClick={e => { e.stopPropagation(); onSelectBlock(b.id, e); }}>
              <rect x={tl.sx - 2} y={tl.sy - 2} width={cs + 4} height={cs + 4} fill="transparent" />
              <rect x={br.sx - cs - 2} y={tl.sy - 2} width={cs + 4} height={cs + 4} fill="transparent" />
              <rect x={tl.sx - 2} y={br.sy - cs - 2} width={cs + 4} height={cs + 4} fill="transparent" />
              <rect x={br.sx - cs - 2} y={br.sy - cs - 2} width={cs + 4} height={cs + 4} fill="transparent" />
              <rect x={tl.sx} y={tl.sy - 4} width={w} height={8} fill="transparent" />
              <rect x={tl.sx} y={br.sy - 4} width={w} height={8} fill="transparent" />
              <rect x={tl.sx - 4} y={tl.sy} width={8} height={h} fill="transparent" />
              <rect x={br.sx - 4} y={tl.sy} width={8} height={h} fill="transparent" />
              <text x={tl.sx + 4} y={tl.sy - 5} fill={bSel ? "#e94560" : "#6a6a9a"} fontSize={9} fontFamily="inherit" fontWeight={600} style={{ pointerEvents: "none" }}>
                SPAN #{b.id} ({b.spannedBlocks.length} blocks)
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
