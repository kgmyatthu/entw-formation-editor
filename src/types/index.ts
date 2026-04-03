export type EntityDescription = string;
export interface EntityPreference { priority: number; description: EntityDescription; }
export type UnitCategory = "INF" | "CAV" | "ART" | "NAV" | "GEN" | "ANY" | "OTH" | "MIX";
export type UnitCategoryKey = "infantry" | "cavalry" | "artillery" | "command" | "naval" | "other";
export type Arrangement = "Line" | "Column" | "CrescentFront" | "CrescentBack";
export type BlockType = "absolute" | "relative" | "spanning";

interface BlockBase {
  id: number; blockPriority: number; arrangement: Arrangement; spacing: number;
  crescentYOffset: number; x: number; y: number; minThreshold: number; maxThreshold: number;
  entities: EntityPreference[];
}
export interface AbsoluteBlock extends BlockBase { type: "absolute"; }
export interface RelativeBlock extends BlockBase { type: "relative"; relativeToBlock: number; }
export interface SpanningBlock { id: number; type: "spanning"; spannedBlocks: number[]; }
export type Block = AbsoluteBlock | RelativeBlock | SpanningBlock;

export type Purpose = "Attack" | "Defend" | "River_Attack" | "Naval_Attack" | "Naval_Defend";
export interface Formation {
  name: string; priority: number; purposes: Purpose[];
  min_artillery: number; min_infantry: number; min_cavalry: number;
  factions: string[]; blocks: Block[];
}

export interface BlockPosition { ax: number; ay: number; w: number; h: number; }
export type PositionMap = Record<number, BlockPosition>;
export interface ViewState { x: number; y: number; scale: number; }
export interface DragState { blockId: number; offsetX: number; offsetY: number; parentPos: BlockPosition | null; }
export interface PanState { startX: number; startY: number; origX: number; origY: number; }
export interface AnchorPromptState { deletingId: number; candidates: (AbsoluteBlock | RelativeBlock)[]; }
export type BlockUpdate = Partial<BlockBase & { relativeToBlock: number }>;

export interface FormationCanvasProps {
  formation: Formation | null; selectedBlockId: number | null; selectedBlockIds: Set<number>;
  onSelectBlock: (blockId: number, event?: React.MouseEvent) => void;
  onUpdateBlock: (blockId: number, update: Partial<BlockBase>) => void;
  posScaleX: number; posScaleY: number; blockScale: number; blockThickness: number;
}
export interface PropertyEditorProps {
  formation: Formation | null; selectedBlockId: number | null; selectedBlockIds: Set<number>;
  onUpdateFormation: (update: Partial<Formation>) => void;
  onUpdateBlock: (blockId: number, update: Partial<Block>) => void;
  onBulkUpdateBlocks: (update: BlockUpdate) => void;
  onAddBlock: (type: "relative" | "spanning") => void;
  onDeleteBlock: (blockId: number) => void;
  onDuplicateBlock: (blockId: number) => void;
}
export interface ImportModalProps { onClose: () => void; onImport: (formations: Formation[]) => void; }
export interface ExportModalProps { formations: Formation[]; onClose: () => void; }
export interface AnchorPromptModalProps {
  deletingId: number; candidates: (AbsoluteBlock | RelativeBlock)[];
  onConfirm: (newAnchorId: number) => void; onCancel: () => void;
}
export interface RubyRawBlock {
  type: string; priority?: number; shape?: string; spacing?: number; crescent_yoffset?: number;
  x?: number; y?: number; min_threshold?: number; max_threshold?: number;
  relative_to?: number; blocks?: number[]; pairs?: { priority: number; unit_class: string }[];
}
export interface RubyRawFormation {
  name: string; priority?: number; purpose?: string;
  min_artillery?: number; min_infantry?: number; min_cavalry?: number;
  factions?: string[]; lines?: RubyRawBlock[];
}
