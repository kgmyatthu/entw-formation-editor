/**
 * @file components/PropertyEditor.tsx
 * @description Right-side panel for editing formation metadata and block properties.
 */
import type { PropertyEditorProps, Block, BlockUpdate } from '../types';
import { UNIT_COLORS, UNIT_CATEGORY_MAP, ALL_ENTITY_TYPES } from '../constants/units';
import { ALL_PURPOSES, ALL_ARRANGEMENTS } from '../constants/formations';
import type { Arrangement, UnitCategoryKey, Purpose } from '../types';
import { getBlockColor, getBlockLabel } from '../utils/blockHelpers';
import { r2 } from '../utils/positions';
import S from '../constants/styles';

interface CategoryButton { label: string; cat: UnitCategoryKey; bg: string; fg: string; }
const CATEGORY_BUTTONS: CategoryButton[] = [
  { label: "+ All INF", cat: "infantry", bg: "#1e3a5f", fg: "#60a5fa" },
  { label: "+ All CAV", cat: "cavalry", bg: "#3a1f1f", fg: "#f87171" },
  { label: "+ All ART", cat: "artillery", bg: "#3a2f1f", fg: "#fbbf24" },
  { label: "+ All NAV", cat: "naval", bg: "#1f2f3a", fg: "#38bdf8" },
];

export default function PropertyEditor({
  formation, selectedBlockId, selectedBlockIds = new Set(), onUpdateFormation,
  onUpdateBlock, onBulkUpdateBlocks, onAddBlock, onDeleteBlock, onDuplicateBlock,
}: PropertyEditorProps): JSX.Element {
  if (!formation) return <div style={S.panel}><div style={{ ...S.panelSection, color: "#666", fontSize: 15 }}>No formation selected</div></div>;

  const block: Block | undefined = formation.blocks.find(b => b.id === selectedBlockId);

  return (
    <div style={S.panel}>
      <div style={S.sidebarHeader}>Properties</div>
      <div style={S.scrollable}>
        {/* Formation metadata */}
        <div style={S.panelSection}>
          <span style={{ ...S.label, color: "#e94560", fontSize: 13 }}>Formation</span>
          <div style={S.row}><div style={{ flex: 1 }}><span style={S.label}>Name</span>
            <input style={S.input} value={formation.name} onChange={e => onUpdateFormation({ name: e.target.value })} /></div></div>
          <div style={S.row}><div style={{ flex: 1 }}><span style={S.label}>AI Priority</span>
            <input style={S.input} type="number" step="0.1" value={r2(formation.priority)}
              onChange={e => onUpdateFormation({ priority: r2(parseFloat(e.target.value) || 0) })} /></div></div>
          <div style={{ marginBottom: 10 }}>
            <span style={S.label}>AI Purpose</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {ALL_PURPOSES.map(p => (
                <label key={p} style={{ fontSize: 14, display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }}>
                  <input type="checkbox" checked={formation.purposes.includes(p)}
                    onChange={e => { const next = e.target.checked ? [...formation.purposes, p] : formation.purposes.filter(pp => pp !== p); onUpdateFormation({ purposes: next as Purpose[] }); }} />{p}
                </label>
              ))}
            </div>
          </div>
          <div style={S.row}>
            <div style={{ flex: 1 }}><span style={S.label}>Min Inf %</span><input style={S.input} type="number" value={formation.min_infantry} onChange={e => onUpdateFormation({ min_infantry: parseInt(e.target.value) || 0 })} /></div>
            <div style={{ flex: 1 }}><span style={S.label}>Min Cav %</span><input style={S.input} type="number" value={formation.min_cavalry} onChange={e => onUpdateFormation({ min_cavalry: parseInt(e.target.value) || 0 })} /></div>
            <div style={{ flex: 1 }}><span style={S.label}>Min Art %</span><input style={S.input} type="number" value={formation.min_artillery} onChange={e => onUpdateFormation({ min_artillery: parseInt(e.target.value) || 0 })} /></div>
          </div>
          <div style={{ marginBottom: 8 }}><span style={S.label}>Factions (comma-separated)</span>
            <input style={S.input} value={formation.factions.join(", ")} onChange={e => onUpdateFormation({ factions: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} /></div>
        </div>
        <div style={S.panelSection}>
          <div style={S.row}>
            <span style={{ ...S.label, flex: 1, marginBottom: 0 }}>Blocks ({formation.blocks.length})</span>
            <button style={S.btnSmall} onClick={() => onAddBlock("relative")}>+ Relative</button>
            <button style={S.btnSmall} onClick={() => onAddBlock("spanning")}>+ Span</button>
          </div>
        </div>

        {/* Single block editor */}
        {block && (
          <div style={S.panelSection}>
            <div style={S.row}>
              <span style={{ ...S.label, flex: 1, color: "#e94560", marginBottom: 0, fontSize: 13 }}>
                Block #{block.id} ({block.type}){block.type === "absolute" ? " ⚓" : ""}
              </span>
              <button style={S.btnSmall} onClick={() => onDuplicateBlock(block.id)}>Duplicate</button>
              <button style={{ ...S.btnSmall, color: "#e94560" }} onClick={() => onDeleteBlock(block.id)}>Delete</button>
            </div>
            {block.type === "spanning" ? (
              <div style={{ marginTop: 8 }}>
                <span style={S.label}>Spanned Blocks</span>
                <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                  <button style={S.btnSmall} onClick={() => { const allIds = formation.blocks.filter(b => b.type !== "spanning").map(b => b.id); onUpdateBlock(block.id, { spannedBlocks: allIds }); }}>Select All</button>
                  <button style={S.btnSmall} onClick={() => onUpdateBlock(block.id, { spannedBlocks: [] })}>Clear All</button>
                </div>
                <div style={{ maxHeight: 200, overflowY: "auto", background: "#1a1a35", borderRadius: 4, padding: 4 }}>
                  {formation.blocks.filter(b => b.type !== "spanning" && b.id !== block.id).map(b => {
                    const checked = block.spannedBlocks.includes(b.id);
                    return (
                      <label key={b.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 6px", cursor: "pointer", background: checked ? "rgba(233,69,96,0.1)" : "transparent", borderRadius: 3, marginBottom: 2 }}>
                        <input type="checkbox" checked={checked} onChange={e => {
                          const next = e.target.checked ? [...block.spannedBlocks, b.id].sort((a, c) => a - c) : block.spannedBlocks.filter(x => x !== b.id);
                          onUpdateBlock(block.id, { spannedBlocks: next });
                        }} />
                        <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: getBlockColor(b), flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: "#ccc" }}>#{b.id} {getBlockLabel(b).toUpperCase()}</span>
                        <span style={{ fontSize: 11, color: "#667", marginLeft: "auto" }}>{b.type}</span>
                      </label>
                    );
                  })}
                </div>
                <div style={{ fontSize: 11, color: "#667", marginTop: 6 }}>{block.spannedBlocks.length} blocks — IDs: [{block.spannedBlocks.join(", ")}]</div>
              </div>
            ) : (<>
              <div style={S.row}>
                <div style={{ flex: 1 }}><span style={S.label}>Block Priority</span>
                  <input style={S.input} type="number" step="0.01" value={r2(block.blockPriority)} onChange={e => onUpdateBlock(block.id, { blockPriority: r2(parseFloat(e.target.value) || 0) })} /></div>
                <div style={{ flex: 1 }}><span style={S.label}>Arrangement</span>
                  <select style={S.select} value={block.arrangement} onChange={e => onUpdateBlock(block.id, { arrangement: e.target.value as Arrangement })}>
                    {ALL_ARRANGEMENTS.map(a => <option key={a} value={a}>{a}</option>)}</select></div>
              </div>
              {block.type === "relative" && <div style={S.row}><div style={{ flex: 1 }}><span style={S.label}>Relative To Block</span>
                <select style={S.select} value={block.relativeToBlock} onChange={e => onUpdateBlock(block.id, { relativeToBlock: parseInt(e.target.value) })}>
                  {formation.blocks.filter(b => b.id !== block.id).map(b => <option key={b.id} value={b.id}>#{b.id} ({b.type})</option>)}</select></div></div>}
              <div style={S.row}>
                <div style={{ flex: 1 }}><span style={S.label}>Position X</span>
                  <input style={S.input} type="number" step="1" value={block.x} onChange={e => onUpdateBlock(block.id, { x: parseInt(e.target.value) || 0 })} /></div>
                <div style={{ flex: 1 }}><span style={S.label}>Position Y</span>
                  <input style={S.input} type="number" step="1" value={block.y} onChange={e => onUpdateBlock(block.id, { y: parseInt(e.target.value) || 0 })} /></div>
              </div>
              <div style={S.row}>
                <div style={{ flex: 1 }}><span style={S.label}>Spacing</span>
                  <input style={S.input} type="number" step="0.5" value={r2(block.spacing)} onChange={e => onUpdateBlock(block.id, { spacing: r2(parseFloat(e.target.value) || 0) })} /></div>
                <div style={{ flex: 1 }}><span style={S.label}>Crescent Y Offset</span>
                  <input style={S.input} type="number" step="1" value={r2(block.crescentYOffset)} onChange={e => onUpdateBlock(block.id, { crescentYOffset: r2(parseFloat(e.target.value) || 0) })} /></div>
              </div>
              <div style={S.row}>
                <div style={{ flex: 1 }}><span style={S.label}>Min Threshold</span>
                  <input style={S.input} type="number" value={block.minThreshold} onChange={e => onUpdateBlock(block.id, { minThreshold: parseInt(e.target.value) || 0 })} /></div>
                <div style={{ flex: 1 }}><span style={S.label}>Max Threshold (-1=∞)</span>
                  <input style={S.input} type="number" value={block.maxThreshold} onChange={e => onUpdateBlock(block.id, { maxThreshold: parseInt(e.target.value) })} /></div>
              </div>
              <div style={{ marginTop: 10 }}>
                <div style={S.row}><span style={{ ...S.label, flex: 1, marginBottom: 0 }}>Entity Preferences</span>
                  <button style={S.btnSmall} onClick={() => { onUpdateBlock(block.id, { entities: [...block.entities, { priority: 1.0, description: "infantry_line" }] }); }}>+ Add</button></div>
                <div style={{ display: "flex", gap: 4, marginTop: 6, marginBottom: 6, flexWrap: "wrap" }}>
                  {CATEGORY_BUTTONS.map(({ label, cat, bg, fg }) => (
                    <button key={cat} style={{ ...S.btnSmall, background: bg, color: fg, fontSize: 11 }} onClick={() => {
                      const existing = new Set(block.entities.map(e => e.description));
                      const toAdd = UNIT_CATEGORY_MAP[cat].filter(t => !existing.has(t)).map(t => ({ priority: 1.0, description: t }));
                      if (toAdd.length) onUpdateBlock(block.id, { entities: [...block.entities, ...toAdd] });
                    }}>{label}</button>
                  ))}
                  <button style={{ ...S.btnSmall, background: "#2a1a2a", color: "#c084fc", fontSize: 11 }} onClick={() => onUpdateBlock(block.id, { entities: [] })}>Clear All</button>
                </div>
                {block.entities.map((ent, ei) => (
                  <div key={ei} style={S.entityRow}>
                    <span style={S.badge(UNIT_COLORS[ent.description] || "#666")} />
                    <input style={{ ...S.input, width: 60, padding: "6px 6px" }} type="number" step="0.1" min="0" max="1" value={r2(ent.priority)}
                      onChange={e => { const ne = [...block.entities]; ne[ei] = { ...ne[ei], priority: r2(parseFloat(e.target.value) || 0) }; onUpdateBlock(block.id, { entities: ne }); }} />
                    <select style={{ ...S.select, flex: 1, fontSize: 13 }} value={ent.description}
                      onChange={e => { const ne = [...block.entities]; ne[ei] = { ...ne[ei], description: e.target.value }; onUpdateBlock(block.id, { entities: ne }); }}>
                      {[...ALL_ENTITY_TYPES, ...UNIT_CATEGORY_MAP.naval].map(t => <option key={t} value={t}>{t}</option>)}</select>
                    <button style={{ ...S.btnSmall, color: "#e94560", padding: "4px 8px" }}
                      onClick={() => { onUpdateBlock(block.id, { entities: block.entities.filter((_, i) => i !== ei) }); }}>✕</button>
                  </div>
                ))}
              </div>
            </>)}
          </div>
        )}

        {!block && selectedBlockIds.size <= 1 && <div style={{ ...S.panelSection, color: "#666", fontSize: 15 }}>Click a block to edit.<br /><span style={{ fontSize: 12 }}>Ctrl+click for bulk edit.</span></div>}

        {/* Bulk edit panel */}
        {selectedBlockIds.size > 1 && (() => {
          const ids = [...selectedBlockIds];
          const selectedBlocks = ids.map(id => formation.blocks.find(b => b.id === id)).filter((b): b is Block => b !== undefined);
          const nonSpanning = selectedBlocks.filter(b => b.type !== "spanning");
          return (
            <div style={{ ...S.panelSection, background: "#1a1035", borderTop: "1px solid #3a2a5a" }}>
              <span style={{ ...S.label, color: "#f59e0b", marginBottom: 8, fontSize: 14 }}>⚡ Bulk Edit — {selectedBlockIds.size} blocks</span>
              <div style={{ fontSize: 12, color: "#778", marginBottom: 10 }}>IDs: {ids.sort((a, b) => a - b).join(", ")} ({nonSpanning.length} editable)</div>
              {nonSpanning.length > 0 && (<>
                <div style={S.row}>
                  <div style={{ flex: 1 }}><span style={S.label}>Block Priority</span>
                    <input style={S.input} type="number" step="0.01" placeholder="—" onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) onBulkUpdateBlocks({ blockPriority: r2(v) }); }} /></div>
                  <div style={{ flex: 1 }}><span style={S.label}>Arrangement</span>
                    <select style={S.select} value="" onChange={e => { if (e.target.value) onBulkUpdateBlocks({ arrangement: e.target.value as Arrangement }); }}>
                      <option value="">— keep —</option>{ALL_ARRANGEMENTS.map(a => <option key={a} value={a}>{a}</option>)}</select></div>
                </div>
                <div style={S.row}>
                  <div style={{ flex: 1 }}><span style={S.label}>Spacing</span><input style={S.input} type="number" step="0.5" placeholder="—" onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) onBulkUpdateBlocks({ spacing: r2(v) }); }} /></div>
                  <div style={{ flex: 1 }}><span style={S.label}>Position X</span><input style={S.input} type="number" step="1" placeholder="—" onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v)) onBulkUpdateBlocks({ x: v }); }} /></div>
                </div>
                <div style={S.row}>
                  <div style={{ flex: 1 }}><span style={S.label}>Position Y</span><input style={S.input} type="number" step="1" placeholder="—" onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v)) onBulkUpdateBlocks({ y: v }); }} /></div>
                  <div style={{ flex: 1 }}><span style={S.label}>Relative To</span>
                    <select style={S.select} value="" onChange={e => { if (e.target.value !== "") onBulkUpdateBlocks({ relativeToBlock: parseInt(e.target.value) }); }}>
                      <option value="">— keep —</option>{formation.blocks.filter(b => !selectedBlockIds.has(b.id)).map(b => <option key={b.id} value={b.id}>#{b.id}</option>)}</select></div>
                </div>
                <div style={S.row}>
                  <div style={{ flex: 1 }}><span style={S.label}>Min Threshold</span><input style={S.input} type="number" placeholder="—" onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v)) onBulkUpdateBlocks({ minThreshold: v }); }} /></div>
                  <div style={{ flex: 1 }}><span style={S.label}>Max Threshold</span><input style={S.input} type="number" placeholder="—" onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v)) onBulkUpdateBlocks({ maxThreshold: v }); }} /></div>
                </div>
                <div style={{ display: "flex", gap: 4, marginTop: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, color: "#778", lineHeight: "28px" }}>Quick pri:</span>
                  {[0.25, 0.5, 0.75, 1.0, 1.5, 2.0].map(v => <button key={v} style={S.btnSmall} onClick={() => onBulkUpdateBlocks({ blockPriority: v })}>{v}</button>)}
                </div>
              </>)}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
