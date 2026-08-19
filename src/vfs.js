/* ============================================================================
   vfs.js — dual storage: disk (primary) + OPFS (backup)
   Monthly YAML files (YYYY-MM.data.yaml) under a "data/" directory.
   Disk via showDirectoryPicker() — user-owned, survives browser data clearing.
   OPFS via navigator.storage.getDirectory() — automatic backup on every write.
   Exposes window.VFS with fetch/save/available/pickDirectory/diskReady.
   js-yaml is loaded globally.
   ========================================================================== */

(() => {
  const ROOT_DIR = 'data';

  // --- Minimal IndexedDB for persisting directory handle across sessions ---
  function idb(store, mode, fn) {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('ag-handles', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('handles');
      req.onsuccess = () => {
        const tx = req.result.transaction('handles', mode);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        fn(tx.objectStore('handles'));
      };
      req.onerror = () => reject(req.error);
    });
  }
  async function idbGet(key) {
    let val = null;
    await idb('handles', 'readonly', (s) => {
      const r = s.get(key);
      r.onsuccess = () => (val = r.result || null);
    });
    return val;
  }
  async function idbSet(key, value) {
    await idb('handles', 'readwrite', (s) => s.put(value, key));
  }

  class FileSystemVFS {
    constructor() {
      this._diskDir = null;
      this._opfsRoot = null;
    }

    async _opfs() {
      if (!this._opfsRoot) {
        if (!navigator.storage || !navigator.storage.getDirectory) return null;
        this._opfsRoot = await navigator.storage.getDirectory();
      }
      return this._opfsRoot;
    }

    async _disk() {
      if (this._diskDir) return this._diskDir;
      const saved = await idbGet('diskDir');
      if (!saved) return null;
      const perm = await saved.queryPermission({ mode: 'readwrite' });
      if (perm === 'granted') { this._diskDir = saved; return saved; }
      return null; // handle exists but needs re-grant
    }

    /** User picks a directory (requires click gesture). */
    async pickDirectory() {
      if (!window.showDirectoryPicker) throw new Error('showDirectoryPicker not supported');
      const handle = await window.showDirectoryPicker();
      await idbSet('diskDir', handle);
      this._diskDir = handle;
      await handle.getDirectoryHandle(ROOT_DIR, { create: true });
      return handle;
    }

    /** Re-request permission for a previously-saved handle (requires click gesture). */
    async requestDiskPermission() {
      const saved = await idbGet('diskDir');
      if (!saved) return false;
      const ok = await saved.requestPermission({ mode: 'readwrite' });
      if (ok === 'granted') { this._diskDir = saved; return true; }
      return false;
    }

    async hasDiskHandle() { return !!(await idbGet('diskDir')); }
    async diskReady() { return !!(await this._disk()); }

    /** Copy OPFS files to disk — only files that don't already exist on disk. */
    async migrateOpfsToDisk() {
      const disk = this._diskDir;
      if (!disk) return;
      const opfs = await this._opfs();
      if (!opfs) return;
      try {
        const opfsData = await opfs.getDirectoryHandle(ROOT_DIR);
        const diskData = await disk.getDirectoryHandle(ROOT_DIR, { create: true });
        for await (const [name, handle] of opfsData.entries()) {
          if (handle.kind !== 'file') continue;
          try { await diskData.getFileHandle(name); continue; } catch {} // exists, skip
          const file = await handle.getFile();
          const text = await file.text();
          const w = await diskData.getFileHandle(name, { create: true });
          const writable = await w.createWritable();
          await writable.write(text);
          await writable.close();
        }
      } catch {} // OPFS data dir doesn't exist yet — nothing to migrate
    }

    async _readFile(handle) {
      const file = await handle.getFile();
      const text = await file.text();
      try { return jsyaml.load(text) || {}; }
      catch (e) { console.warn('VFS: parse failed for ' + handle.name, e); return {}; }
    }

    async _writeFile(handle, data) {
      const yaml = jsyaml.dump(data, { defaultFlowStyle: false, lineWidth: -1 });
      const writable = await handle.createWritable();
      await writable.write(yaml);
      await writable.close();
    }

    async fetch(filename) {
      // Disk first
      try {
        const disk = await this._disk();
        if (disk) {
          const dir = await disk.getDirectoryHandle(ROOT_DIR, { create: true });
          return this._readFile(await dir.getFileHandle(filename));
        }
      } catch (e) { if (!e || e.name !== 'NotFoundError') console.warn('VFS: disk fetch ' + filename, e); }
      // OPFS fallback
      try {
        const opfs = await this._opfs();
        if (opfs) {
          const dir = await opfs.getDirectoryHandle(ROOT_DIR, { create: true });
          return this._readFile(await dir.getFileHandle(filename));
        }
      } catch (e) { if (!e || e.name !== 'NotFoundError') console.warn('VFS: OPFS fetch ' + filename, e); }
      return {};
    }

    async save(filename, data) {
      // Disk (primary)
      try {
        const disk = await this._disk();
        if (disk) {
          const dir = await disk.getDirectoryHandle(ROOT_DIR, { create: true });
          await this._writeFile(await dir.getFileHandle(filename, { create: true }), data);
        }
      } catch (e) { console.warn('VFS: disk save ' + filename, e); }
      // OPFS (backup — always)
      try {
        const opfs = await this._opfs();
        if (opfs) {
          const dir = await opfs.getDirectoryHandle(ROOT_DIR, { create: true });
          await this._writeFile(await dir.getFileHandle(filename, { create: true }), data);
        }
      } catch (e) { console.warn('VFS: OPFS backup ' + filename, e); }
    }

    async available() {
      if (await this._disk()) return true;
      const opfs = await this._opfs();
      return !!opfs;
    }
  }

  window.VFS = new FileSystemVFS();
})();