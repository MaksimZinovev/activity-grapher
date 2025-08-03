# ADR 001: Filesystem Storage Implementation Strategy

## Status

**Accepted**

## Context

The activity grapher application currently uses IndexedDB for storage with YAML serialization, but the requirements specify storing data as separate YAML files on the filesystem. This document analyzes the key architectural decisions for implementing filesystem-based YAML storage.

## Key Questions and Analysis

### 1. Storage Strategy: Pure File System Access API vs Hybrid Approach

**Option 1: Pure File System Access API**
- **Pros**: 
  - Direct filesystem access meeting core requirement
  - YAML files directly visible and editable by users
  - Simple, single storage system
  - Clean implementation path
- **Cons**:
  - Limited browser support (Chrome/Edge only)
  - Requires file permissions each session
  - Not available in Firefox/Safari

**Option 2: Hybrid Approach with IndexedDB Fallback**
- **Pros**:
  - Broader browser compatibility
  - Graceful degradation when API unavailable
  - Works across all browsers
- **Cons**:
  - Complex implementation with dual storage systems
  - Doesn't fully meet YAML file requirement in unsupported browsers
  - Increased maintenance burden

### 2. File Persistence: Handle Persistence vs Manual Selection

**Option 1: File System Access API Persistence**
- **Pros**:
  - Seamless user experience
  - No repeated file selection
  - File handles persist across sessions
  - Web-app-like behavior
- **Cons**:
  - Storage quota limitations
  - Handles may become invalid
  - Complex implementation

**Option 2: Manual File Selection Each Session**
- **Pros**:
  - Simple implementation
  - Explicit user control
  - Works across devices
- **Cons**:
  - Poor user experience
  - Requires file selection every time
  - Not typical for web applications

### 3. Migration Strategy: Automatic Migration vs Fresh Start

**Option 1: Automatic Migration from IndexedDB**
- **Pros**:
  - Preserves existing user data
  - Seamless transition for users
  - No data loss during upgrade
- **Cons**:
  - Complex migration logic
  - Risk of data corruption
  - Additional implementation complexity

**Option 2: Fresh Start with Filesystem Only**
- **Pros**:
  - Clean implementation
  - No migration complexity
  - Meets requirement directly
- **Cons**:
  - Loses all existing data
  - Users must re-enter activities
  - Poor user experience

### 4. Error Fallback: Backward Compatibility Strategy

**Option 1: IndexedDB Fallback**
- **Pros**:
  - Application works everywhere
  - No data loss in unsupported browsers
  - Broader compatibility
- **Cons**:
  - Doesn't meet requirements in unsupported browsers
  - Complex dual implementation
  - Potential confusion about data location

**Option 2: Error Message with Requirements**
- **Pros**:
  - Clear user expectations
  - Simpler implementation
  - Meets requirements where supported
- **Cons**:
  - Application unusable in unsupported browsers
  - Limits user base
  - Poor accessibility

### 5. File Organization: Directory Structure

**Option 1: Data Directory Structure**
- **Pros**:
  - Clean organization
  - Separates data from app files
  - Easier to manage as data grows
  - Scalable solution
- **Cons**:
  - Requires directory creation
  - More complex path handling
  - Additional setup complexity

**Option 2: Root Directory Storage**
- **Pros**:
  - Simpler implementation
  - Flat structure
  - Easier file access
- **Cons**:
  - Cluttered root directory
  - Mixes data and app files
  - Poor organization

## Decision

Based on the analysis, the following decisions are made:

1. **Pure File System Access API with IndexedDB fallback** - Primary implementation uses File System Access API to meet requirements, with graceful fallback to IndexedDB for broader compatibility.

2. **File handle persistence** - Use File System Access API persistence for seamless user experience, avoiding repeated file selection.

3. **Automatic migration** - Implement automatic migration from IndexedDB to preserve existing user data during the transition.

4. **IndexedDB fallback** - Maintain IndexedDB as fallback for unsupported browsers to ensure application functionality everywhere.

5. **Data directory structure** - Create organized `data/` directory structure for monthly YAML files to ensure scalability and clean organization.

## Consequences

- Implementation will be more complex due to dual storage support
- Users will have seamless experience regardless of browser support
- Existing data will be preserved during migration
- Data organization will be scalable and maintainable
- Application will meet core requirements where supported while providing fallback elsewhere

## Links

- Related to: [docs/filesystem-storage-todo.md](./filesystem-storage-todo.md)
- Implementation tracking: [docs/requirements-status.md](../requirements-status.md)