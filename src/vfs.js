/* ============================================================================
   vfs.js — File System Access API storage
   Monthly YAML files (YYYY-MM.data.yaml) under a "data/" directory.
   Exposes window.VFS with fetch/save/available. js-yaml is loaded globally.
   ========================================================================== */

(() => {
  const ROOT_DIR = 'data';

  class FileSystemVFS {
    constructor() {
      this._ready = null;
    }

    /** Lazily resolve the root directory handle. */
    async _root() {
      if (!this._ready) {
        this._ready = (async () => {
          if (!navigator.storage || !navigator.storage.getDirectory) {
            throw new Error('File System Access API not supported. Use a Chromium-based browser.');
          }
          const root = await navigator.storage.getDirectory();
          await root.getDirectoryHandle(ROOT_DIR, { create: true });
          return root;
        })();
      }
      return this._ready;
    }

    async _readFile(handle) {
      const file = await handle.getFile();
      const text = await file.text();
      try {
        return jsyaml.load(text) || {};
      } catch (e) {
        console.warn('VFS: failed to parse ' + handle.name + ', treating as empty', e);
        return {};
      }
    }

    async _writeFile(handle, data) {
      const yaml = jsyaml.dump(data, { defaultFlowStyle: false, lineWidth: -1 });
      const writable = await handle.createWritable();
      await writable.write(yaml);
      await writable.close();
    }

    /** Fetch a monthly file (YYYY-MM.data.yaml) → object (empty {} if missing). */
    async fetch(filename) {
      try {
        const root = await this._root();
        const dir = await root.getDirectoryHandle(ROOT_DIR, { create: true });
        const handle = await dir.getFileHandle(filename);
        return this._readFile(handle);
      } catch (e) {
        if (e && e.name === 'NotFoundError') return {};
        console.warn('VFS: fetch ' + filename + ' failed', e);
        return {};
      }
    }

    /** Save an object to a monthly file. */
    async save(filename, data) {
      const root = await this._root();
      const dir = await root.getDirectoryHandle(ROOT_DIR, { create: true });
      const handle = await dir.getFileHandle(filename, { create: true });
      await this._writeFile(handle, data);
    }

    /** Supported & permission ok? */
    async available() {
      try {
        await this._root();
        return true;
      } catch (e) {
        return false;
      }
    }
  }

  window.VFS = new FileSystemVFS();
})();