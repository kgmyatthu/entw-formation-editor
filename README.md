# NTW GroupFormation Visual Editor

A React-based visual editor for **Napoleon Total War** `groupformations.bin` — the binary file that controls AI army deployment formations.

## Features

- **Import/Export** — Parses both XML (`GroupFormations.xml`) and taw's Ruby `.txt` format; exports to both
- **2D SVG Canvas** — Pan/zoom/drag blocks with arrangement-aware shapes (Line, Column, Crescent)
- **Block Property Editor** — Full editing of priority, arrangement, position, spacing, thresholds, entity preferences
- **Spanning Block Config** — Checkbox UI for selecting which blocks a spanning block covers
- **Multi-select** — Ctrl+click blocks for bulk editing; Ctrl/Shift+click formations for batch AI priority
- **Selective Export** — Multi-select formations in sidebar, export only those
- **Anchor Management** — Delete/promote anchor blocks with modal chooser and automatic ID re-indexing
- **Canvas Settings** — Configurable position scale X/Y, block length, block thickness
- **Sequential ID Enforcement** — Block deletion re-indexes all IDs and updates all references

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

## Build for Production

```bash
npm run build
npm run preview   # preview the build locally
```

## Usage Workflow

1. Use taw's `gfunpack` to convert `groupformations.bin` → `.txt`
2. Click **Import** → paste the Ruby `.txt` content → Import
3. Edit formations visually on the canvas and property panel
4. Click **Export** → copy Ruby `.txt` output
5. Use taw's `gfpack` to convert `.txt` → `groupformations.bin`
6. Place in your NTW data folder

## Project Structure

```
src/
├── main.jsx                    # React entry point
├── App.jsx                     # Root component — state management, sidebar, layout
├── constants/
│   ├── index.js                # Barrel export
│   ├── units.js                # Unit colors, categories, class integer mappings
│   ├── formations.js           # Purposes, arrangements, shape mappings
│   └── styles.js               # Shared inline style definitions
├── utils/
│   ├── parsers.js              # Ruby .txt and XML import parsers
│   ├── exporters.js            # Ruby .txt and XML export serializers
│   ├── positions.js            # Absolute position computation from relative offsets
│   └── blockHelpers.js         # Block color, label, category detection, factory
└── components/
    ├── FormationCanvas.jsx     # SVG canvas with pan/zoom/drag/selection
    ├── PropertyEditor.jsx      # Right panel — formation/block/bulk editing
    ├── ImportModal.jsx         # Import dialog (XML / Ruby format)
    ├── ExportModal.jsx         # Export dialog with copy button
    └── AnchorPromptModal.jsx   # Anchor block deletion/promotion chooser
```

## Key Domain Knowledge

- `groupformations.bin` has no official Assembly Kit for NTW
- Community tool by **taw** ([github.com/taw/etwng](https://github.com/taw/etwng)) is the only bidirectional converter
- Unit class integers are **alphabetically ordered**: `artillery_fixed=0`, `cavalry_heavy=4`, `infantry_line=18`, `any=46`
- Shape values: `0=Line`, `1=Column`, `2=CrescentFront`, `3=CrescentBack`
- Purpose bitmask: `1=Attack`, `2=Defend`, `4=River_Attack`, `32=Naval_Attack`, `64=Naval_Defend`
- Positions are **center-to-center additive offsets**

## License

MIT
