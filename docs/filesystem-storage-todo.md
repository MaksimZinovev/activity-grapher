# Filesystem Storage Implementation Plan

## TODO: Filesystem-based YAML Storage

### Subtasks

1. **Research File System Access API compatibility and implementation patterns** ✅ **COMPLETED**
   - Evaluate browser support and fallback strategies ✅
   - Prototype file read/write operations for YAML ✅
   - Test async file operations vs IndexedDB performance ✅

   **Research Report**: [docs/filesystem-storage-research-report.md](./filesystem-storage-research-report.md)
   *(30% visuals, 70% text format as requested)*

   **Key Findings**:
   - Chrome/Edge: Full API support ✓
   - Firefox/Safari: No API support, requires IndexedDB fallback ❌
   - **MVP Decision**: Chrome-only implementation for initial release
   - **Future Enhancement**: Multi-browser support with fallback

2. **Replace VFS class with File System Access API implementation** ✅ **COMPLETED**
   - ✅ Implemented `FileSystemVFS` class replacing IndexedDB
   - ✅ Chrome-only support using `navigator.storage.getDirectory()`
   - ✅ Added file handle persistence with seamless user experience
   - ✅ Updated all VFS interface calls to use file operations
   - ✅ Added debugging tools for filesystem verification
   - ✅ Verified data persistence and functionality
   - **Future Enhancement**: Add fallback mechanisms for broader compatibility

3. **Create monthly file structure from existing yearly data** ⏳ **PENDING**
   - Split `YYYY.data.yaml` into `YYYY-MM.data.yaml` files
   - Implement file naming convention: `data/YYYY-MM-data.yaml`
   - Add directory structure management
   - Update file access patterns in application logic

4. **Implement migration from IndexedDB to filesystem YAML files** ⏳ **PENDING**
   - One-time migration utility for existing data
   - Validate data integrity after migration
   - **MVP Simplification**: Direct migration to monthly files
   - Handle migration failure scenarios gracefully

5. **Add error handling for Chrome-only implementation** ⏳ **PENDING**
   - Basic error handling for file permission issues
   - Graceful handling of Chrome storage quota limits
   - User notifications for storage status
   - **Future Enhancement**: Multi-browser fallback mechanisms

6. **Future Enhancement: Multi-browser support** 📅 **POST-MVP**
   - Add IndexedDB fallback for Firefox/Safari
   - Implement browser detection and auto-selection
   - Ensure cross-browser data compatibility
   - Enhanced error handling and user guidance

## Implementation Decisions

**For detailed analysis and alternatives, see: [docs/adr-001-filesystem-storage.md](./adr-001-filesystem-storage.md)**

### Key Recommendations

#### MVP Implementation (Chrome-only)

1. **Storage Strategy**: Use **Pure File System Access API** - Chrome-only implementation with `navigator.storage.getDirectory()` for seamless user experience.
2. **File Persistence**: Use **Origin Private Storage** - No user permissions required, automatic persistence across sessions.
3. **Migration Strategy**: Use **Automatic migration from IndexedDB** - Preserves existing user data during transition, ensure smooth upgrade.
4. **Error Handling**: Use **Chrome-focused error handling** - Basic error handling for storage quota and permission issues in Chrome environment.
5. **File Organization**: Use **Data directory structure** - Creates organized `data/` directory for monthly YAML files, ensures scalability.

#### Future Enhancement (Multi-browser)

6. **Browser Compatibility**: Add **IndexedDB fallback** - Maintain application functionality across Firefox/Safari when File System Access API unavailable.
7. **Enhanced Error Handling**: Implement **graceful degradation** - Seamless fallback between storage systems with user notifications.
8. **Cross-browser Support**: Ensure **universal accessibility** - Application works reliably across all modern browsers.
