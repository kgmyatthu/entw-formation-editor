/**
 * @file components/AnchorPromptModal.tsx
 * @description Modal for selecting a new anchor block when deleting the current one.
 */
import { useState } from 'react';
import type { AnchorPromptModalProps } from '../types';
import { getBlockColor, getBlockLabel } from '../utils/blockHelpers';
import { r2 } from '../utils/positions';
import S from '../constants/styles';

export default function AnchorPromptModal({ deletingId, candidates, onConfirm, onCancel }: AnchorPromptModalProps): JSX.Element {
  const [chosen, setChosen] = useState<number>(candidates[0]?.id ?? 0);

  return (
    <div style={S.modal} onClick={onCancel}>
      <div style={{ ...S.modalContent, maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        <div style={{ ...S.row, marginBottom: 14 }}>
          <h3 style={{ margin: 0, flex: 1, fontSize: 18 }}>⚓ Choose New Anchor Block</h3>
          <button style={S.btnSmall} onClick={onCancel}>✕</button>
        </div>
        <p style={{ fontSize: 14, color: "#aab", margin: "0 0 12px", lineHeight: 1.5 }}>
          You are deleting the anchor block <b style={{ color: "#e94560" }}>#{deletingId}</b>.
          Select which block should become the new anchor (block #0).
        </p>
        <div style={{ maxHeight: 280, overflowY: "auto", background: "#1a1a35", borderRadius: 6, padding: 6 }}>
          {candidates.map(b => {
            const color = getBlockColor(b);
            const label = getBlockLabel(b).toUpperCase();
            const active = chosen === b.id;
            return (
              <div key={b.id} onClick={() => setChosen(b.id)} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", cursor: "pointer",
                borderRadius: 4, marginBottom: 3,
                background: active ? "rgba(233,69,96,0.2)" : "transparent",
                border: active ? "1px solid #e94560" : "1px solid transparent",
              }}>
                <input type="radio" checked={active} onChange={() => setChosen(b.id)} style={{ accentColor: "#e94560" }} />
                <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 3, background: color, flexShrink: 0 }} />
                <span style={{ fontSize: 14, color: "#ddd", fontWeight: active ? 700 : 400 }}>#{b.id} {label}</span>
                <span style={{ fontSize: 12, color: "#667", marginLeft: "auto" }}>{b.type} · pos({r2(b.x)},{r2(b.y)})</span>
              </div>
            );
          })}
        </div>
        <div style={{ ...S.row, marginTop: 16, justifyContent: "flex-end", gap: 8 }}>
          <button style={S.btn(false)} onClick={onCancel}>Cancel</button>
          <button style={S.btn(true)} onClick={() => onConfirm(chosen)}>
            Delete ⚓#{deletingId} → Promote #{chosen}
          </button>
        </div>
      </div>
    </div>
  );
}
