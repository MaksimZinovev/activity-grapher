# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Client-side web application for tracking and visualizing daily activities using GitHub-style contribution graphs. Built as a single HTML file with embedded CSS/JS.

```mermaid
graph TD
    A[form.html] --> B[Activity Graph Component]
    A --> C[VFS Class<br>IndexedDB Storage]
    A --> D[UI/Logic]
    B --> E[@hsablonniere/activity-graph]
    C --> F[IndexedDB]
    C --> G[YAML Serialization]
    D --> H[Day Selection]
    D --> I[Activity Entry]
    D --> J[Board Management]
```

## Architecture Overview

```mermaid
graph LR
    subgraph Client Side
        UI[HTML/CSS/JS] --> VFS[VFS Class]
        UI --> GRAPH[Graph Component]
        VFS --> IDB[IndexedDB]
        IDB <--> YAML[YAML Format]
    end
    
    subgraph Requirements
        REQ_FS[Filesystem YAML] -->|Not Implemented| CURRENT[Current: IndexedDB]
        REQ_MONTHLY[Monthly Files] -->|Not Implemented| YEARLY[Current: Yearly Files]
    end
```

### Key Components

#### Virtual File System (VFS)
- **Current**: IndexedDB interface with YAML serialization
- **Required**: Filesystem access via File System Access API
- **Status**: Temporary implementation (⚠️ needs replacement)

```mermaid
sequenceDiagram
    participant UI as User Interface
    participant VFS as VFS Class
    participant DB as IndexedDB
    UI->>VFS: fetch(filename)
    VFS->>DB: transaction.get(filename)
    DB-->>VFS: data
    VFS-->>UI: parsed YAML
```

#### Activity Graph System
```mermaid
graph TD
    GRAPH[Activity Graph] --> DATA[Activity Data]
    DATA --> LEVELS[Intensity Levels 1-6]
    DATA --> HOVER[Hover Tooltips]
    DATA --> SELECT[Day Selection]
    SELECT --> PANEL[Side Panel]
    PANEL --> LIST[Activity List]
    PANEL --> INPUT[Add Activity]
```

#### Board Management
```mermaid
graph LR
    BOARDS[Boards] --> DEFAULT[default]
    BOARDS --> FUTURE[coding<br>swimming<br>learning]
    DEFAULT -->|Current| RENAME[Rename Function]
    FUTURE -->|Required| DD[Dropdown Options]
```

## Current vs Required Implementation

### Storage Strategy
```mermaid
graph TB
    subgraph Current Implementation
        IDB[IndexedDB] --> YEARLY[Yearly Files<br>2025.data.yaml]
    end
    
    subgraph Required Implementation
        FS[Filesystem] --> MONTHLY[Monthly Files<br>2025-01.data.yaml<br>2025-02.data.yaml<br>...]
    end
    
    Current -.->|Migration Needed| Required
```

### Data Structure
```mermaid
graph TD
    subgraph Current Format
        YEAR["2025.data.yaml:"] --> DEFAULT["default:"]
        DEFAULT --> DATE["2025-07-03:"]
        DATE --> ACTIVITY["- description: 'Activity'"]
    end
    
    subgraph Required Format  
        MONTH["2025-07.data.yaml:"] --> DEFAULT2["default:"]
        DEFAULT2 --> DATE2["2025-07-03:"]
        DATE2 --> ACTIVITY2["- description: 'Activity'"]
    end
```

## Development Commands

No build system required. Serve locally:
```bash
live-server --port=8000 --open=form.html --host=localhost
```
Open: http://localhost:8000/form.html

## Browser Requirements

```mermaid
graph TD
    BROWSER[Modern Browser] --> ES[ES Modules]
    BROWSER --> IDB[IndexedDB]
    BROWSER --> SHADOW[Shadow DOM]
    BROWSER --> CSS[CSS Variables & Grid]
    
    FUTURE[Future Needs] -->|For Requirements| FILE_API[File System Access API]
```

## File Structure
```
├── form.html               # Main interactive app
├── index.html             # Read-only preview  
├── settings.yaml          # Field configuration
├── 2025-07.data.yaml      # Sample data (IndexedDB only)
├── archive/               # Legacy code
└── docs/
    └── requirements-status.md  # Implementation tracking
```

## Known Implementation Gaps

```mermaid
graph LR
    GAP1[❌ Filesystem YAML Storage] -->|Current: IndexedDB| FIXED1[Replace with File API]
    GAP2[❌ Monthly File Organization] -->|Current: Yearly| FIXED2[Restructure files]
    GAP3[❌ Multiple Activity Graphs] -->|Current: default only| FIXED3[Add predefined types]
    GAP4[❌ Dedicated Add Button] -->|Current: Enter key| FIXED4[Add UI button]
```

## Quick Reference

| Component | Status | Action Required |
|-----------|--------|-----------------|
| Base UI | ✅ Complete | None |
| Activity Entry | ✅ Complete | None |
| Graph Rendering | ✅ Complete | None |
| Storage System | ⚠️ Temporary | Replace with filesystem |
| File Organization | ⚠️ Yearly | Convert to monthly |
| Board System | ⚠️ Basic only | Add predefined types |

## Browser Testing with Playwright MCP

For web testing and browser automation, use Playwright MCP tools:
- Navigate: `mcp__playwright__browser_navigate(url)`
- Interact: `mcp__playwright__browser_click(element, ref)`
- Wait: `mcp__playwright__browser_wait_for(time)`