import { ComponentType, useEffect, useMemo, useRef, useState } from 'react';
import { Ketcher, StructServiceProvider } from 'ketcher-core';
import Raphael from 'raphael';

interface Props {
  initialSmiles: string;
  onApply: (smiles: string) => void;
  onClose: () => void;
}

export function StructureSketcherModal({ initialSmiles, onApply, onClose }: Props) {
  const ketcherRef = useRef<Ketcher | null>(null);
  const loadedRef = useRef(false);
  const loadTimerRef = useRef<number | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadingCurrent, setLoadingCurrent] = useState(false);
  const [editorComponent, setEditorComponent] = useState<ComponentType<{
    staticResourcesUrl: string;
    structServiceProvider: StructServiceProvider;
    onInit: (ketcher: Ketcher) => void;
    errorHandler: (error: string) => void;
    disableMacromoleculesEditor?: boolean;
  }> | null>(null);
  const [structServiceProvider, setStructServiceProvider] = useState<StructServiceProvider | null>(null);

  useEffect(() => {
    loadedRef.current = false;
    setMessage('');
  }, [initialSmiles]);

  useEffect(() => () => {
    if (loadTimerRef.current !== null) window.clearTimeout(loadTimerRef.current);
  }, []);

  useEffect(() => {
    let canceled = false;
    type BrowserProcessShim = {
      env: Record<string, string | undefined>;
      nextTick: (callback: (...args: unknown[]) => void, ...args: unknown[]) => void;
      stderr?: { isTTY?: boolean; columns?: number; getColorDepth?: () => number };
      pid?: number;
      noDeprecation?: boolean;
    };
    class BrowserEventEmitter {
      private listeners = new Map<string, Array<(...args: unknown[]) => void>>();

      on(event: string, listener: (...args: unknown[]) => void) {
        const next = this.listeners.get(event) ?? [];
        next.push(listener);
        this.listeners.set(event, next);
        return this;
      }

      addListener(event: string, listener: (...args: unknown[]) => void) {
        return this.on(event, listener);
      }

      once(event: string, listener: (...args: unknown[]) => void) {
        const wrapped = (...args: unknown[]) => {
          this.removeListener(event, wrapped);
          listener(...args);
        };
        return this.on(event, wrapped);
      }

      removeListener(event: string, listener: (...args: unknown[]) => void) {
        const next = (this.listeners.get(event) ?? []).filter((candidate) => candidate !== listener);
        this.listeners.set(event, next);
        return this;
      }

      off(event: string, listener: (...args: unknown[]) => void) {
        return this.removeListener(event, listener);
      }

      removeAllListeners(event?: string) {
        if (event) this.listeners.delete(event);
        else this.listeners.clear();
        return this;
      }

      emit(event: string, ...args: unknown[]) {
        for (const listener of this.listeners.get(event) ?? []) listener(...args);
        return (this.listeners.get(event) ?? []).length > 0;
      }
    }
    const globalScope = globalThis as unknown as {
      process?: BrowserProcessShim;
      global?: typeof globalThis;
      Buffer?: unknown;
      require?: (moduleName: string) => unknown;
    };
    globalScope.global ??= globalThis;
    const processShim = globalScope.process as BrowserProcessShim | undefined;
    globalScope.process = processShim ?? {
      env: {},
      nextTick: (callback, ...args) => queueMicrotask(() => callback(...args)),
      stderr: { isTTY: false },
      pid: 0
    };
    globalScope.process.env ??= {};
    globalScope.process.nextTick ??= (callback, ...args) => queueMicrotask(() => callback(...args));
    globalScope.require ??= (moduleName: string) => {
      if (moduleName === 'events') return { EventEmitter: BrowserEventEmitter, default: BrowserEventEmitter };
      if (moduleName === 'process') return globalScope.process;
      if (moduleName === 'buffer') return { Buffer: globalScope.Buffer };
      if (moduleName === 'raphael') return Raphael;
      throw new Error(`Ketcher browser shim does not support require("${moduleName}")`);
    };
    Promise.all([
      import('ketcher-react'),
      import('ketcher-standalone'),
      import('ketcher-react/dist/index.css')
    ]).then(([reactModule, standaloneModule]) => {
      if (canceled) return;
      setEditorComponent(() => reactModule.Editor);
      setStructServiceProvider(new standaloneModule.StandaloneStructServiceProvider());
    }).catch((error) => {
      if (!canceled) setMessage(`Ketcher \u753b\u677f\u52a0\u8f7d\u5931\u8d25\uff1a${error instanceof Error ? error.message : String(error)}`);
    });
    return () => { canceled = true; };
  }, []);

  const Editor = useMemo(() => editorComponent, [editorComponent]);

  async function loadSmilesToSketcher(ketcher: Ketcher, smiles: string, retried = false): Promise<boolean> {
    try {
      await ketcher.setMolecule(smiles, { needZoom: true });
      return true;
    } catch (error) {
      if (!retried) {
        loadTimerRef.current = window.setTimeout(() => {
          void loadSmilesToSketcher(ketcher, smiles, true);
        }, 250);
        return false;
      }
      setMessage(`\u5f53\u524d SMILES \u65e0\u6cd5\u8f7d\u5165\u753b\u677f\uff1a${error instanceof Error ? error.message : String(error)}\u3002\u53ef\u76f4\u63a5\u91cd\u65b0\u7ed8\u5236\u3002`);
      return false;
    }
  }

  function handleInit(ketcher: Ketcher) {
    ketcherRef.current = ketcher;
    if (loadedRef.current) return;
    loadedRef.current = true;
    const trimmed = initialSmiles.trim();
    if (!trimmed) return;
    loadTimerRef.current = window.setTimeout(() => {
      void loadSmilesToSketcher(ketcher, trimmed);
    }, 120);
  }

  async function loadCurrentStructure() {
    const trimmed = initialSmiles.trim();
    if (!trimmed) {
      setMessage('\u5f53\u524d\u6ca1\u6709\u53ef\u8f7d\u5165\u7684 SMILES\u3002');
      return;
    }
    if (!ketcherRef.current) {
      setMessage('\u753b\u677f\u5c1a\u672a\u5c31\u7eea\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002');
      return;
    }
    setLoadingCurrent(true);
    try {
      const loaded = await loadSmilesToSketcher(ketcherRef.current, trimmed, true);
      if (loaded) setMessage('\u5df2\u8f7d\u5165\u5f53\u524d canonical_smiles\u3002');
    } finally {
      setLoadingCurrent(false);
    }
  }

  async function applyStructure() {
    if (!ketcherRef.current) {
      setMessage('\u753b\u677f\u5c1a\u672a\u5c31\u7eea\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002');
      return;
    }
    setBusy(true);
    try {
      const smiles = (await ketcherRef.current.getSmiles()).trim();
      if (!smiles) {
        setMessage('\u753b\u677f\u4e2d\u6ca1\u6709\u53ef\u7528\u7ed3\u6784\uff0c\u8bf7\u5148\u7ed8\u5236\u6216\u8f7d\u5165\u7ed3\u6784\u3002');
        return;
      }
      onApply(smiles);
    } catch (error) {
      setMessage(`\u65e0\u6cd5\u4ece\u753b\u677f\u5bfc\u51fa SMILES\uff1a${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal sketcher-modal">
        <div className="modal-head">
          <h3>{'\u753b\u677f\u7ed8\u5236\uff08Ketcher\uff09'}</h3>
          <div className="modal-head-actions">
            <button type="button" onClick={loadCurrentStructure} disabled={loadingCurrent}>{loadingCurrent ? '\u8f7d\u5165\u4e2d...' : '\u8f7d\u5165\u5f53\u524d\u7ed3\u6784'}</button>
            <button type="button" className="primary-button" onClick={applyStructure} disabled={busy}>{busy ? '\u5bfc\u51fa\u4e2d...' : '\u4f7f\u7528\u7ed3\u6784'}</button>
            <button type="button" onClick={onClose}>{'\u5173\u95ed'}</button>
          </div>
        </div>
        <div className="sketcher-body">
          {message && <div className="atleastone-hint warning-text">{message}</div>}
          <div className="ketcher-host">
            {Editor && structServiceProvider ? (
              <Editor
                staticResourcesUrl="./"
                structServiceProvider={structServiceProvider}
                onInit={handleInit}
                errorHandler={(error) => setMessage(String(error))}
                disableMacromoleculesEditor
              />
            ) : (
              <div className="ketcher-loading">{'\u6b63\u5728\u52a0\u8f7d Ketcher \u753b\u677f...'}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
