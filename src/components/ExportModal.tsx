/**
 * @file components/ExportModal.tsx
 * @description Export dialog supporting binary .bin download and Ruby .txt copy/download.
 */
import { useState, useMemo } from 'react';
import type { ExportModalProps } from '../types';
import { exportToBinary, exportToRubyText } from '../utils/exporters';
import S from '../constants/styles';

type ExportFormat = "bin" | "ruby";

export default function ExportModal({ formations, onClose }: ExportModalProps): JSX.Element {
  const [format, setFormat] = useState<ExportFormat>("bin");
  const rubyOutput = useMemo<string>(() => {
    try { return exportToRubyText(formations); } catch (e) { return "Error: " + (e instanceof Error ? e.message : String(e)); }
  }, [formations]);

  const downloadBin = (): void => {
    try {
      const buf = exportToBinary(formations);
      const blob = new Blob([buf], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "groupformations.bin";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) { alert("Export error: " + (e instanceof Error ? e.message : String(e))); }
  };
  const downloadTxt = (): void => {
    const blob = new Blob([rubyOutput], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "groupformations.txt";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={S.modal} onClick={onClose}><div style={S.modalContent} onClick={e=>e.stopPropagation()}>
      <div style={{...S.row,marginBottom:14}}><h3 style={{margin:0,flex:1,fontSize:20}}>Export Formations ({formations.length})</h3><button style={S.btnSmall} onClick={onClose}>✕</button></div>
      <div style={{...S.row,marginBottom:10}}>
        <label style={{fontSize:15,cursor:"pointer"}}><input type="radio" checked={format==="bin"} onChange={()=>setFormat("bin")}/> Binary (.bin)</label>
        <label style={{fontSize:15,cursor:"pointer"}}><input type="radio" checked={format==="ruby"} onChange={()=>setFormat("ruby")}/> Ruby .txt (taw)</label>
      </div>
      {format==="bin" ? (
        <div style={{padding:"30px 20px",background:"#1a1a35",borderRadius:6,textAlign:"center"}}>
          <div style={{fontSize:16,color:"#ccc",marginBottom:12}}>📦 groupformations.bin</div>
          <div style={{fontSize:13,color:"#667",marginBottom:16}}>{formations.length} formations · Ready to pack</div>
          <button style={{...S.btn(true),fontSize:16,padding:"12px 32px"}} onClick={downloadBin}>⬇ Download .bin</button>
          <div style={{fontSize:12,color:"#556",marginTop:12}}>Place in data/groupformations/ to use in-game</div>
        </div>
      ) : (
        <>
          <div style={{...S.row,marginBottom:6}}>
            <button style={S.btnSmall} onClick={()=>navigator.clipboard?.writeText(rubyOutput)}>📋 Copy All</button>
            <button style={S.btnSmall} onClick={downloadTxt}>⬇ Download .txt</button>
          </div>
          <textarea value={rubyOutput} readOnly style={{...S.input,height:380,resize:"vertical",fontFamily:"monospace",fontSize:13}}/>
        </>
      )}
      <div style={{...S.row,marginTop:14,justifyContent:"flex-end"}}><button style={S.btn(false)} onClick={onClose}>Close</button></div>
    </div></div>
  );
}
