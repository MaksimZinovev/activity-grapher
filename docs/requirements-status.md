# Requirements Status

This document tracks the implementation status of requirements from `docs/initial-requirements.md`.

## Implementation Status Summary

### ✅ **COMPLETED (17/22)** - 77% Complete

| # | Requirement | Status | Notes |
|---|-------------|--------|-------|
| 1 | Self contained HTML + JS + CSS (single file) | ✅ Complete | `form.html` contains all code in one file |
| 2 | Clean, modern UI with neo brutalism style | ✅ Complete | Dark theme with green accents, custom serializd theme |
| 3 | 1-year activity graph | ✅ Complete | 2025 full year view implemented |
| 4 | Form displaying 1-year activity graph | ✅ Complete | Graph rendered in main interface |
| 5 | Current day/cell selected & highlighted by default | ✅ Complete | Bootstrap initializes with today's date selected |
| 6 | Graph itself used to select date | ✅ Complete | Click handlers on graph cells implemented |
| 7 | Default "graph/board" selected in dropdown | ✅ Complete | "default" board selected by default |
| 8 | User can select day/cell in activity graph | ✅ Complete | Click handlers with visual feedback working |
| 9 | User can see added activities when day/cell selected | ✅ Complete | Side panel shows activities for selected date |
| 10 | User can see rendered activity graph on form | ✅ Complete | Graph updates when data changes |
| 11 | Each activity has "description" field (128 chars max) | ✅ Complete | Input validation and storage implemented |
| 12 | Each activity can have multiple text fields as entries | ✅ Complete | Array structure supports multiple entries per day |
| 13 | User can update name of activity graph | ✅ Complete | Rename button with prompt functionality |
| 14 | User can view entry data by hovering over day/cell | ✅ Complete | Built-in tooltips show activity counts |
| 15 | Basic error handling and validation | ✅ Complete | Input validation, IndexedDB error handling, toasts |
| 16 | All interactive elements have tooltips | ✅ Complete | Tooltip system implemented |
| 17 | Subtle animations for usability | ✅ Complete | CSS transitions for hover effects and interactions |

### ❌ **MISSING / PARTIAL (5/22)** - 23% Remaining

| # | Requirement | Status | Gap Description |
|---|-------------|--------|------------------|
| 1 | Data stored as separate yaml files | ❌ **NOT IMPLEMENTED** | Current: IndexedDB storage<br>Required: Filesystem YAML files |
| 2 | One yaml file for each month | ❌ **NOT IMPLEMENTED** | Current: Year-based files (`2025-07.data.yaml`)<br>Required: Monthly file structure |
| 3 | Graph data loaded from yaml file | ❌ **PARTIAL** | Current: Loaded from IndexedDB (YAML as serialization)<br>Required: Direct file loading |
| 4 | User can select different activity graphs from dropdown | ❌ **PARTIAL** | Current: Only "default" option<br>Required: Multiple predefined types ("coding", "swimming", "learning") |
| 5 | User can click "add" button to enter new activity | ❌ **MISSING UI** | Current: Enter key only<br>Required: Explicit "add" button |

## Next Tasks TODO

### **HIGH PRIORITY (Core Functionality)**

1. **Implement filesystem-based YAML storage** 
   - Replace IndexedDB VFS class with File System Access API
   - Create monthly YAML file structure
   - Implement direct file loading/saving

2. **Add dedicated "Add" button**
   - Add explicit "add" button next to input field
   - Maintain current enter key functionality

3. **Implement multiple predefined activity graphs**
   - Add default options: "coding", "swimming", "learning"
   - Update dropdown initialization with these options

### **MEDIUM PRIORITY (Enhancements)**

4. **File organization structure**
   - Create `data/` directory for monthly YAML files
   - Implement file naming convention: `YYYY-MM-data.yaml`

5. **Error handling for file operations**
   - Handle file permission errors
   - Graceful fallback when File System Access API not available

### **LOW PRIORITY (Polish)**

6. **UI/UX improvements**
   - Better loading states during file operations
   - File conflict resolution dialogs
   - Data export/import functionality

## Technical Clarifications Needed

1. **File Storage Strategy**: Should the app use the File System Access API for direct filesystem access, or should it continue with IndexedDB but export/import YAML files?

2. **Monthly File Structure**: Should existing year-based data be migrated to monthly files, or start fresh with monthly structure?

3. **Multiple Graphs**: Should the predefined graphs ("coding", "swimming", "learning") be hardcoded or user-configurable?

4. **Browser Compatibility**: How important is compatibility with browsers that don't support the File System Access API?

## Current Architecture

The application currently uses:
- **Storage**: IndexedDB with YAML serialization via VFS class
- **Data Structure**: One YAML file per year (e.g., `2025-07.data.yaml`)
- **UI**: Single HTML file with embedded CSS/JS
- **Graph**: `@hsablonniere/activity-graph` web component with custom styling
- **Framework**: Vanilla JavaScript with ES modules