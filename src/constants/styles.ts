/**
 * @file constants/styles.ts
 * @description Shared inline style definitions for the editor UI.
 */
import type { CSSProperties } from 'react';

interface Styles {
  app: CSSProperties;
  sidebar: CSSProperties;
  sidebarHeader: CSSProperties;
  formItem: (selected: boolean) => CSSProperties;
  canvas: CSSProperties;
  panel: CSSProperties;
  panelSection: CSSProperties;
  label: CSSProperties;
  input: CSSProperties;
  select: CSSProperties;
  btn: (accent: boolean) => CSSProperties;
  btnSmall: CSSProperties;
  row: CSSProperties;
  entityRow: CSSProperties;
  scrollable: CSSProperties;
  toolbar: CSSProperties;
  modal: CSSProperties;
  modalContent: CSSProperties;
  badge: (color: string) => CSSProperties;
}

const S: Styles = {
  app: { display: "flex", height: "100vh", fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", background: "#0f0f1a", color: "#d4d4e4", overflow: "hidden", fontSize: 15 },
  sidebar: { width: 270, background: "#14142a", borderRight: "1px solid #2a2a4a", display: "flex", flexDirection: "column", flexShrink: 0 },
  sidebarHeader: { padding: "14px 16px", borderBottom: "1px solid #2a2a4a", fontSize: 14, textTransform: "uppercase", letterSpacing: 2, color: "#8888aa", fontWeight: 700 },
  formItem: (sel) => ({ padding: "11px 16px", cursor: "pointer", background: sel ? "#2a2a5a" : "transparent", borderLeft: sel ? "3px solid #e94560" : "3px solid transparent", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", transition: "all .15s" }),
  canvas: { flex: 1, background: "#0a0a18", position: "relative", overflow: "hidden", cursor: "grab" },
  panel: { width: 360, background: "#14142a", borderLeft: "1px solid #2a2a4a", display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" },
  panelSection: { padding: "14px 16px", borderBottom: "1px solid #1e1e3a" },
  label: { fontSize: 12, textTransform: "uppercase", letterSpacing: 1.5, color: "#7777aa", marginBottom: 5, display: "block", fontWeight: 600 },
  input: { width: "100%", background: "#1a1a35", border: "1px solid #2a2a4a", borderRadius: 4, color: "#d4d4e4", padding: "8px 10px", fontSize: 15, fontFamily: "inherit", boxSizing: "border-box" as const },
  select: { width: "100%", background: "#1a1a35", border: "1px solid #2a2a4a", borderRadius: 4, color: "#d4d4e4", padding: "8px 10px", fontSize: 15, fontFamily: "inherit", boxSizing: "border-box" as const },
  btn: (accent) => ({ padding: "9px 18px", background: accent ? "#e94560" : "#2a2a5a", border: "none", borderRadius: 4, color: "#fff", cursor: "pointer", fontSize: 14, fontFamily: "inherit", fontWeight: 600 }),
  btnSmall: { padding: "6px 12px", background: "#2a2a5a", border: "none", borderRadius: 3, color: "#bbb", cursor: "pointer", fontSize: 13, fontFamily: "inherit" },
  row: { display: "flex", gap: 8, alignItems: "center", marginBottom: 8 },
  entityRow: { display: "flex", gap: 6, alignItems: "center", padding: "7px 8px", background: "#1a1a35", borderRadius: 4, marginBottom: 4 },
  scrollable: { overflowY: "auto", flex: 1 },
  toolbar: { display: "flex", gap: 8, padding: "10px 16px", borderBottom: "1px solid #2a2a4a", flexWrap: "wrap" },
  modal: { position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modalContent: { background: "#14142a", border: "1px solid #2a2a4a", borderRadius: 8, padding: 28, width: 660, maxHeight: "85vh", display: "flex", flexDirection: "column" },
  badge: (c) => ({ display: "inline-block", width: 14, height: 14, borderRadius: 3, background: c, flexShrink: 0, border: "1px solid rgba(0,0,0,.3)" }),
};

export default S;
