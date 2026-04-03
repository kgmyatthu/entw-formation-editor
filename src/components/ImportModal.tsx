/**
 * @file components/ImportModal.tsx
 * @description Import dialog supporting binary .bin upload and Ruby .txt paste/upload.
 */
import { useState, useRef } from 'react';
import type { ImportModalProps } from '../types';
import { parseBinary, parseRubyText } from '../utils/parsers';
import S from '../constants/styles';

type ImportFormat = "bin" | "ruby";

export default function ImportModal({ onClose, onImport }: ImportModalProps): JSX.Element {
  const [text, setText] = useState<string>("");
  const [format, setFormat] = useState<ImportFormat>("bin");
  const [error, setError] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);
  const binRef = useRef<ArrayBuffer | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const isBin = file.name.endsWith(".bin");
    setFormat(isBin ? "bin" : "ruby");
    const reader = new FileReader();
    if (isBin) {
      reader.onload = () => { binRef.current = reader.result as ArrayBuffer; setText(`[Binary: ${file.name} — ${(reader.result as ArrayBuffer).byteLength} bytes]`); };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = () => { setText(reader.result as string); binRef.current = null; };
      reader.readAsText(file);
    }
  };

  const go = (): void => {
    try {
      setError("");
      const f = format === "bin"
        ? (() => { if (!binRef.current) throw new Error("Upload a .bin file first"); return parseBinary(binRef.current); })()
        : (() => { if (!text || text.startsWith("[Binary")) throw new Error("Paste or upload Ruby .txt"); return parseRubyText(text); })();
      if (!f.length) throw new Error("No formations found");
      onImport(f); onClose();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };

  return (
    <div style={S.modal} onClick={onClose}><div style={S.modalContent} onClick={e=>e.stopPropagation()}>
      <div style={{...S.row,marginBottom:14}}><h3 style={{margin:0,flex:1,fontSize:20}}>Import Formations</h3><button style={S.btnSmall} onClick={onClose}>✕</button></div>
      <div style={{...S.row,marginBottom:10}}>
        <label style={{fontSize:15,cursor:"pointer"}}><input type="radio" checked={format==="bin"} onChange={()=>setFormat("bin")}/> Binary (.bin)</label>
        <label style={{fontSize:15,cursor:"pointer"}}><input type="radio" checked={format==="ruby"} onChange={()=>setFormat("ruby")}/> Ruby .txt (taw)</label>
      </div>
      <div style={{...S.row,marginBottom:10}}>
        <button style={S.btn(false)} onClick={()=>fileRef.current?.click()}>📁 Upload File {fileName && `(${fileName})`}</button>
        <input ref={fileRef} type="file" accept=".bin,.txt" style={{display:"none"}} onChange={handleFileUpload}/>
        <span style={{fontSize:12,color:"#667"}}>{format==="bin"?"Select groupformations.bin":"Select .txt from gfunpack"}</span>
      </div>
      {format==="ruby" && <textarea value={text} onChange={e=>{setText(e.target.value);binRef.current=null;}}
        placeholder="Or paste taw's Ruby .txt output here..." style={{...S.input,height:280,resize:"vertical",fontFamily:"monospace",fontSize:14}}/>}
      {format==="bin" && binRef.current && (
        <div style={{padding:"20px",background:"#1a1a35",borderRadius:6,textAlign:"center",color:"#8899aa",fontSize:14}}>
          ✅ Binary loaded: {fileName} ({binRef.current.byteLength.toLocaleString()} bytes)
        </div>
      )}
      {error && <div style={{color:"#e94560",fontSize:15,marginTop:10}}>{error}</div>}
      <div style={{...S.row,marginTop:14,justifyContent:"flex-end"}}><button style={S.btn(false)} onClick={onClose}>Cancel</button><button style={S.btn(true)} onClick={go}>Import</button></div>
    </div></div>
  );
}
