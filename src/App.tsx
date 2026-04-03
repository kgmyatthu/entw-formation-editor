/**
 * @file App.tsx
 * @description Root application component — all state management, sidebar, settings, modals.
 */
import { useState, useRef, useCallback } from 'react';
import type { Formation, Block, AbsoluteBlock, RelativeBlock, AnchorPromptState, BlockUpdate } from './types';
import { createDefaultFormation } from './utils/blockHelpers';
import { r2 } from './utils/positions';
import FormationCanvas from './components/FormationCanvas';
import PropertyEditor from './components/PropertyEditor';
import ImportModal from './components/ImportModal';
import ExportModal from './components/ExportModal';
import AnchorPromptModal from './components/AnchorPromptModal';
import S from './constants/styles';

export default function App(): JSX.Element {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [selectedFormationIdx, setSelectedFormationIdx] = useState<number>(-1);
  const [selectedIdxs, setSelectedIdxs] = useState<Set<number>>(new Set());
  const lastClickedRef = useRef<number>(-1);
  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(null);
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<number>>(new Set());
  const [showImport, setShowImport] = useState<boolean>(false);
  const [showExport, setShowExport] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showInfo, setShowInfo] = useState<boolean>(false);
  const [anchorPrompt, setAnchorPrompt] = useState<AnchorPromptState | null>(null);
  const [posScaleX, setPosScaleX] = useState<number>(0.50);
  const [posScaleY, setPosScaleY] = useState<number>(0.15);
  const [blockScale, setBlockScale] = useState<number>(0.70);
  const [blockThickness, setBlockThickness] = useState<number>(1.0);

  const formation: Formation | null = selectedFormationIdx >= 0 ? formations[selectedFormationIdx] : null;

  const handleFormationClick = useCallback((i: number, e: React.MouseEvent): void => {
    if (e.ctrlKey || e.metaKey) {
      setSelectedIdxs(prev => { const next = new Set(prev); if (next.has(i)) next.delete(i); else next.add(i); return next; });
      setSelectedFormationIdx(i); lastClickedRef.current = i;
    } else if (e.shiftKey && lastClickedRef.current >= 0) {
      const lo = Math.min(lastClickedRef.current, i), hi = Math.max(lastClickedRef.current, i);
      setSelectedIdxs(prev => { const next = new Set(prev); for (let j = lo; j <= hi; j++) next.add(j); return next; });
      setSelectedFormationIdx(i);
    } else {
      setSelectedFormationIdx(i); setSelectedIdxs(new Set([i])); lastClickedRef.current = i;
    }
    setSelectedBlockId(null); setSelectedBlockIds(new Set());
  }, []);

  const batchUpdateAIPriority = useCallback((val: number): void => {
    setFormations(prev => prev.map((f, i) => selectedIdxs.has(i) ? { ...f, priority: val } : f));
  }, [selectedIdxs]);

  const updateFormation = useCallback((u: Partial<Formation>): void => {
    setFormations(p => p.map((f, i) => i === selectedFormationIdx ? { ...f, ...u } : f));
  }, [selectedFormationIdx]);

  const updateBlock = useCallback((bid: number, u: Partial<Block>): void => {
    setFormations(p => p.map((f, i) => {
      if (i !== selectedFormationIdx) return f;
      return { ...f, blocks: f.blocks.map(b => b.id === bid ? { ...b, ...u } as Block : b) };
    }));
  }, [selectedFormationIdx]);

  const handleBlockSelect = useCallback((bid: number, e?: React.MouseEvent): void => {
    if (e && (e.ctrlKey || e.metaKey)) {
      setSelectedBlockIds(prev => { const next = new Set(prev); if (next.has(bid)) next.delete(bid); else next.add(bid); return next; });
      setSelectedBlockId(bid);
    } else { setSelectedBlockId(bid); setSelectedBlockIds(new Set([bid])); }
  }, []);

  const bulkUpdateBlocks = useCallback((u: BlockUpdate): void => {
    setFormations(p => p.map((f, i) => {
      if (i !== selectedFormationIdx) return f;
      return { ...f, blocks: f.blocks.map(b => selectedBlockIds.has(b.id) ? { ...b, ...u } as Block : b) };
    }));
  }, [selectedFormationIdx, selectedBlockIds]);

  const addBlock = useCallback((type: "relative" | "spanning"): void => {
    setFormations(p => p.map((f, i) => {
      if (i !== selectedFormationIdx) return f;
      const nid = Math.max(...f.blocks.map(b => b.id), -1) + 1;
      const nb: Block = type === "spanning"
        ? { id: nid, type: "spanning", spannedBlocks: f.blocks.filter(b => b.type !== "spanning").map(b => b.id) }
        : { id: nid, type: "relative", blockPriority: 0.5, arrangement: "Line", spacing: 2, crescentYOffset: 0, x: 0, y: -10, relativeToBlock: 0, minThreshold: 0, maxThreshold: -1, entities: [{ priority: 1, description: "infantry_line" }] };
      return { ...f, blocks: [...f.blocks, nb] };
    }));
  }, [selectedFormationIdx]);

  const performDelete = useCallback((bid: number, newAnchorId: number | null): void => {
    let newSelBlockId: number | null = selectedBlockId;
    setFormations(p => p.map((f, i) => {
      if (i !== selectedFormationIdx || f.blocks.length <= 1) return f;
      const deleted = f.blocks.find(b => b.id === bid);
      if (!deleted) return f;
      let remaining = f.blocks.filter(b => b.id !== bid);

      if (deleted.type === "absolute" && newAnchorId !== null) {
        remaining = remaining.map(b => {
          if (b.id === newAnchorId) { const p: AbsoluteBlock = { ...b as RelativeBlock, type: "absolute", x: 0, y: 0, blockPriority: (b as RelativeBlock).blockPriority, arrangement: (b as RelativeBlock).arrangement, spacing: (b as RelativeBlock).spacing, crescentYOffset: (b as RelativeBlock).crescentYOffset, minThreshold: (b as RelativeBlock).minThreshold, maxThreshold: (b as RelativeBlock).maxThreshold, entities: (b as RelativeBlock).entities }; return p; }
          return b;
        });
        remaining = remaining.map(b => b.type === "relative" && b.relativeToBlock === bid ? { ...b, relativeToBlock: newAnchorId } : b);
        const anchor = remaining.find(b => b.id === newAnchorId)!;
        remaining = [anchor, ...remaining.filter(b => b.id !== newAnchorId)];
      } else {
        const anchorId = remaining.find(b => b.type === "absolute")?.id ?? remaining[0]?.id ?? 0;
        remaining = remaining.map(b => b.type === "relative" && b.relativeToBlock === bid ? { ...b, relativeToBlock: anchorId } : b);
      }

      const idMap: Record<number, number> = {};
      remaining.forEach((b, idx) => { idMap[b.id] = idx; });
      if (selectedBlockId === bid) newSelBlockId = null;
      else if (selectedBlockId !== null && idMap[selectedBlockId] !== undefined) newSelBlockId = idMap[selectedBlockId];

      const reindexed: Block[] = remaining.map((b, idx) => {
        const nb = { ...b, id: idx };
        if (nb.type === "relative") nb.relativeToBlock = idMap[nb.relativeToBlock] ?? 0;
        if (nb.type === "spanning") nb.spannedBlocks = nb.spannedBlocks.filter(s => s !== bid && idMap[s] !== undefined).map(s => idMap[s]);
        return nb as Block;
      });
      return { ...f, blocks: reindexed };
    }));
    setSelectedBlockId(newSelBlockId);
    setSelectedBlockIds(newSelBlockId !== null ? new Set([newSelBlockId]) : new Set());
  }, [selectedFormationIdx, selectedBlockId]);

  const deleteBlock = useCallback((bid: number): void => {
    if (!formation) return;
    const block = formation.blocks.find(b => b.id === bid);
    if (!block || formation.blocks.length <= 1) return;
    if (block.type === "absolute") {
      const candidates = formation.blocks.filter((b): b is AbsoluteBlock | RelativeBlock => b.id !== bid && b.type !== "spanning");
      if (candidates.length === 0) return;
      setAnchorPrompt({ deletingId: bid, candidates });
      return;
    }
    performDelete(bid, null);
  }, [formation, performDelete]);

  const confirmAnchorDelete = useCallback((newAnchorId: number): void => {
    if (!anchorPrompt) return;
    performDelete(anchorPrompt.deletingId, newAnchorId);
    setAnchorPrompt(null);
  }, [anchorPrompt, performDelete]);

  const duplicateBlock = useCallback((bid: number): void => {
    setFormations(prev => prev.map((f, i) => {
      if (i !== selectedFormationIdx) return f;
      const src = f.blocks.find(b => b.id === bid);
      if (!src) return f;
      const dupe: Block = JSON.parse(JSON.stringify(src));
      dupe.id = Math.max(...f.blocks.map(b => b.id), -1) + 1;
      if (dupe.type !== "spanning") { dupe.x = (dupe.x || 0) + 2; dupe.y = (dupe.y || 0) - 2; }
      return { ...f, blocks: [...f.blocks, dupe] };
    }));
  }, [selectedFormationIdx]);

  const clearBlockSelection = (): void => { setSelectedBlockId(null); setSelectedBlockIds(new Set()); };

  interface SettingSlider { label: string; value: number; set: (v: number) => void; min: number; max: number; step: number; presets: number[]; suffix?: string; }
  const settingSliders: SettingSlider[] = [
    { label: "Position Scale X", value: posScaleX, set: setPosScaleX, min: 0.01, max: 2.0, step: 0.01, presets: [0.05, 0.10, 0.25, 0.5] },
    { label: "Position Scale Y", value: posScaleY, set: setPosScaleY, min: 0.01, max: 2.0, step: 0.01, presets: [0.05, 0.10, 0.25, 0.5] },
    { label: "Block Length", value: blockScale, set: setBlockScale, min: 0.3, max: 3.0, step: 0.1, presets: [0.5, 1.0, 1.5, 2.0], suffix: "x" },
    { label: "Block Thickness", value: blockThickness, set: setBlockThickness, min: 0.3, max: 3.0, step: 0.1, presets: [0.5, 1.0, 1.5, 2.0], suffix: "x" },
  ];

  return (
    <div style={S.app}>
      <div style={S.sidebar}>
        <div style={{ ...S.sidebarHeader, display: "flex", alignItems: "center" }}>
          <span style={{ flex: 1 }}>Formations</span><span style={{ fontSize: 12, color: "#555" }}>{formations.length}</span>
        </div>
        <div style={S.toolbar}>
          <button style={S.btn(true)} onClick={() => setShowImport(true)}>Import</button>
          <button style={S.btn(false)} onClick={() => formations.length && setShowExport(true)}>
            {selectedIdxs.size > 1 ? `Export (${selectedIdxs.size})` : "Export"}
          </button>
          <button style={S.btn(false)} onClick={() => {
            const ni = formations.length;
            setFormations(p => [...p, createDefaultFormation()]);
            setSelectedFormationIdx(ni); setSelectedIdxs(new Set([ni])); clearBlockSelection();
          }}>+ New</button>
          <button style={{ ...S.btn(false), marginLeft: "auto" }} onClick={() => setShowInfo(true)} title="Important warnings">ℹ️</button>
          <button style={S.btn(false)} onClick={() => setShowSettings(s => !s)}>⚙</button>
        </div>

        {showSettings && (
          <div style={{ ...S.panelSection, background: "#1a1a35", borderBottom: "1px solid #2a2a4a" }}>
            <span style={{ ...S.label, marginBottom: 8 }}>Canvas Settings</span>
            <div style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 4, padding: "8px 10px", marginBottom: 12, fontSize: 12, color: "#fbbf24", lineHeight: 1.5 }}>
              ⚠️ These controls only affect the <b>visual rendering</b> on the canvas — they do not change the actual formation data or export values. Leave as default unless you know what you're doing.
            </div>
            {settingSliders.map(({ label, value, set, min, max, step, presets, suffix }, idx) => (
              <div key={label}>
                {idx > 0 && <div style={{ height: 1, background: "#2a2a4a", margin: "10px 0" }} />}
                <div style={{ ...S.row, marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: "#aab", flex: 1 }}>{label}</span>
                  <span style={{ fontSize: 13, color: "#e94560", fontWeight: 600, width: 40, textAlign: "right" }}>{value.toFixed(2)}</span>
                </div>
                <input type="range" min={min} max={max} step={step} value={value} onChange={e => set(parseFloat(e.target.value))} style={{ width: "100%", accentColor: "#e94560", cursor: "pointer" }} />
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  {presets.map(v => (
                    <button key={v} style={{ ...S.btnSmall, background: value === v ? "#e94560" : "#2a2a5a", color: value === v ? "#fff" : "#aaa" }}
                      onClick={() => set(v)}>{v}{suffix || ""}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={S.scrollable}>
          {formations.map((f, i) => {
            const isPrimary = i === selectedFormationIdx;
            const isMulti = selectedIdxs.has(i);
            return (
              <div key={i} style={{ ...S.formItem(isPrimary), ...(isMulti && !isPrimary ? { background: "rgba(233,69,96,0.12)", borderLeft: "3px solid #e94560" } : {}) }}
                onClick={e => handleFormationClick(i, e)} title={f.name}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>
                  {isMulti && !isPrimary && <span style={{ color: "#e94560", marginRight: 4 }}>✓</span>}{f.name}
                </div>
                <div style={{ fontSize: 12, color: "#666", marginTop: 3 }}>
                  {f.blocks.filter(b => b.type !== "spanning").length} blocks · pri:{r2(f.priority)} · {f.purposes.join(", ") || "—"}
                </div>
              </div>
            );
          })}
          {formations.length === 0 && <div style={{ padding: "24px 16px", color: "#555", fontSize: 15, textAlign: "center", lineHeight: 1.7 }}>No formations loaded.<br />Click Import to load.</div>}
        </div>

        {selectedIdxs.size > 1 && (
          <div style={{ ...S.panelSection, background: "#1a1a35", borderTop: "1px solid #2a2a4a" }}>
            <span style={{ ...S.label, color: "#e94560", marginBottom: 6 }}>{selectedIdxs.size} formations selected</span>
            <div style={S.row}><div style={{ flex: 1 }}><span style={S.label}>Batch AI Priority</span>
              <input style={S.input} type="number" step="0.01" placeholder="Set..." onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) batchUpdateAIPriority(r2(v)); }} /></div></div>
            <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
              {[0, 0.25, 0.5, 0.75, 1.0].map(v => <button key={v} style={S.btnSmall} onClick={() => batchUpdateAIPriority(v)}>{v}</button>)}
            </div>
            <button style={{ ...S.btnSmall, marginTop: 8, color: "#888" }} onClick={() => setSelectedIdxs(new Set(selectedFormationIdx >= 0 ? [selectedFormationIdx] : []))}>Clear Selection</button>
          </div>
        )}

        {selectedFormationIdx >= 0 && (
          <div style={S.toolbar}>
            <button style={S.btnSmall} onClick={() => {
              if (!formation) return;
              const d: Formation = JSON.parse(JSON.stringify(formation)); d.name += " (copy)";
              const ni = formations.length; setFormations(p => [...p, d]); setSelectedFormationIdx(ni); setSelectedIdxs(new Set([ni]));
            }}>Duplicate</button>
            <button style={{ ...S.btnSmall, color: "#e94560" }} onClick={() => {
              setFormations(p => p.filter((_, i) => i !== selectedFormationIdx));
              setSelectedFormationIdx(-1); setSelectedIdxs(new Set()); clearBlockSelection();
            }}>Delete</button>
          </div>
        )}
      </div>

      <FormationCanvas formation={formation} selectedBlockId={selectedBlockId} selectedBlockIds={selectedBlockIds}
        onSelectBlock={handleBlockSelect} onUpdateBlock={updateBlock}
        posScaleX={posScaleX} posScaleY={posScaleY} blockScale={blockScale} blockThickness={blockThickness} />
      <PropertyEditor formation={formation} selectedBlockId={selectedBlockId} selectedBlockIds={selectedBlockIds}
        onUpdateFormation={updateFormation} onUpdateBlock={updateBlock} onBulkUpdateBlocks={bulkUpdateBlocks}
        onAddBlock={addBlock} onDeleteBlock={deleteBlock} onDuplicateBlock={duplicateBlock} />

      {showImport && <ImportModal onClose={() => setShowImport(false)} onImport={nf => {
        setFormations(nf); setSelectedFormationIdx(0); setSelectedIdxs(new Set([0])); clearBlockSelection();
      }} />}
      {showExport && <ExportModal formations={selectedIdxs.size > 1 ? formations.filter((_, i) => selectedIdxs.has(i)) : formations} onClose={() => setShowExport(false)} />}
      {anchorPrompt && <AnchorPromptModal deletingId={anchorPrompt.deletingId} candidates={anchorPrompt.candidates} onConfirm={confirmAnchorDelete} onCancel={() => setAnchorPrompt(null)} />}
      {showInfo && (
        <div style={S.modal} onClick={() => setShowInfo(false)}>
          <div style={{ ...S.modalContent, maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div style={{ ...S.row, marginBottom: 14 }}>
              <h3 style={{ margin: 0, flex: 1, fontSize: 18 }}>⚠️ Important — Read Before Editing</h3>
              <button style={S.btnSmall} onClick={() => setShowInfo(false)}>✕</button>
            </div>
            <div style={{ lineHeight: 1.7, fontSize: 14, color: "#ccd" }}>
              <div style={{ background: "rgba(233,69,96,0.15)", border: "1px solid rgba(233,69,96,0.4)", borderRadius: 6, padding: "14px 16px", marginBottom: 16 }}>
                <div style={{ fontWeight: 700, color: "#e94560", fontSize: 15, marginBottom: 6 }}>🚨 Do NOT delete vanilla formations</div>
                <div style={{ color: "#dda" }}>
                  Removing any of the game's stock formations from <code style={{ background: "#2a2a5a", padding: "2px 6px", borderRadius: 3, fontSize: 13 }}>groupformations.bin</code> will <b>crash the game</b> on battle load.
                  <br /><br />
                  If you want the AI to never use a formation, <b>set its AI Priority to 0</b> instead of deleting it.
                </div>
              </div>
              <div style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 6, padding: "14px 16px", marginBottom: 16 }}>
                <div style={{ fontWeight: 700, color: "#60a5fa", fontSize: 15, marginBottom: 6 }}>✅ Safe operations</div>
                <ul style={{ margin: "6px 0 0 16px", padding: 0, color: "#aab" }}>
                  <li style={{ marginBottom: 4 }}>Editing block positions, priorities, arrangements, thresholds</li>
                  <li style={{ marginBottom: 4 }}>Changing entity preferences and their priorities</li>
                  <li style={{ marginBottom: 4 }}>Adding new blocks or formations</li>
                  <li style={{ marginBottom: 4 }}>Setting AI Priority to 0 to disable a formation</li>
                </ul>
              </div>
              <div style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 6, padding: "14px 16px", marginBottom: 16 }}>
                <div style={{ fontWeight: 700, color: "#fbbf24", fontSize: 15, marginBottom: 6 }}>💡 Tips</div>
                <ul style={{ margin: "6px 0 0 16px", padding: 0, color: "#aab" }}>
                  <li style={{ marginBottom: 4 }}>Always keep a backup of the original .bin file</li>
                  <li style={{ marginBottom: 4 }}>Empty spanning blocks (0 spanned) will crash the game</li>
                  <li style={{ marginBottom: 4 }}>Block IDs must be sequential — the editor handles this on delete</li>
                </ul>
              </div>
            </div>
            <div style={{ ...S.row, marginTop: 8, justifyContent: "flex-end" }}>
              <button style={S.btn(true)} onClick={() => setShowInfo(false)}>Got it</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
