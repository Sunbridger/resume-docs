import { useEffect, useRef, useState } from "react";
import {
  GlobalWorkerOptions,
  getDocument,
  type PDFDocumentLoadingTask,
  type PDFDocumentProxy,
  type PDFPageProxy,
  type RenderTask,
} from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import tenderPdfUrl from "../../assets/tender.pdf?url";
import { RISK_LEVEL_LABEL, RISKS } from "../../data/risks";

GlobalWorkerOptions.workerSrc = workerUrl;

interface PageState {
  status: "idle" | "rendering" | "rendered";
  task?: RenderTask;
  page?: PDFPageProxy;
}

export interface PdfFocus {
  id: string;
  nonce: number;
}

interface Stats {
  total: number;
  loaded: number;
  cancelled: number;
  fps: number;
  firstRenderMs: number | null;
}

const RENDER_CONCURRENCY = 2;

export function PdfViewer({
  focus,
  onSelectRisk,
  showHud,
}: {
  focus: PdfFocus | null;
  onSelectRisk: (id: string) => void;
  showHud: boolean;
}) {
  const [layout, setLayout] = useState<{ pageCount: number; ratio: number } | null>(null);
  const [renderedPages, setRenderedPages] = useState<number[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    loaded: 0,
    cancelled: 0,
    fps: 60,
    firstRenderMs: null,
  });
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<Array<HTMLDivElement | null>>([]);
  const mountsRef = useRef<Array<HTMLDivElement | null>>([]);
  const pageStates = useRef<Map<number, PageState>>(new Map());
  const docRef = useRef<PDFDocumentProxy | null>(null);
  const loadingTaskRef = useRef<PDFDocumentLoadingTask | null>(null);
  const layoutRef = useRef<{ pageCount: number; ratio: number } | null>(null);
  const queueRef = useRef<number[]>([]);
  const runningRef = useRef(0);
  const loadedRef = useRef<Set<number>>(new Set());
  const scheduleRef = useRef<() => void>(() => {});
  const loadStartedAt = useRef<number>(performance.now());
  const firstRenderDone = useRef(false);

  const renderedSet = new Set(renderedPages);

  function patchStats(patch: Partial<Stats>) {
    setStats((prev) => ({ ...prev, ...patch }));
  }

  async function renderPage(pageNumber: number) {
    const doc = docRef.current;
    const state = pageStates.current.get(pageNumber);
    if (!doc || !state || state.status !== "idle") return;
    state.status = "rendering";

    try {
      const page = state.page ?? (await doc.getPage(pageNumber));
      if (pageStates.current.get(pageNumber)?.status !== "rendering") {
        page.cleanup();
        return;
      }
      state.page = page;

      if (!loadedRef.current.has(pageNumber)) {
        loadedRef.current.add(pageNumber);
        setStats((prev) => ({ ...prev, loaded: loadedRef.current.size }));
      }

      const base = page.getViewport({ scale: 1 });
      const container = scrollRef.current;
      const cssWidth = Math.max(320, (container?.clientWidth ?? 640) - 28);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const viewport = page.getViewport({ scale: (cssWidth / base.width) * dpr });

      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.className = "pdf-canvas";

      const mount = mountsRef.current[pageNumber - 1];
      if (!mount) return;
      mount.replaceChildren(canvas);

      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("Canvas 2D 不可用");

      const task = page.render({ canvas, canvasContext: context, viewport });
      state.task = task;
      await task.promise;
      if (pageStates.current.get(pageNumber)?.status !== "rendering") return;
      state.task = undefined;
      state.status = "rendered";
      setRenderedPages((prev) => (prev.includes(pageNumber) ? prev : [...prev, pageNumber]));

      if (!firstRenderDone.current) {
        firstRenderDone.current = true;
        patchStats({ firstRenderMs: performance.now() - loadStartedAt.current });
      }
    } catch (err) {
      const name = (err as { name?: string })?.name;
      if (name !== "RenderingCancelledException") {
        console.warn("[pdf] 页面渲染失败", pageNumber, err);
      }
    }
  }

  function pump() {
    while (runningRef.current < RENDER_CONCURRENCY && queueRef.current.length > 0) {
      const pageNumber = queueRef.current.shift()!;
      const state = pageStates.current.get(pageNumber);
      if (!state || state.status !== "idle") continue;
      runningRef.current += 1;
      void renderPage(pageNumber).finally(() => {
        runningRef.current -= 1;
        pump();
      });
    }
  }

  function computeVisible(): number[] {
    const container = scrollRef.current;
    if (!container) return [];
    const containerRect = container.getBoundingClientRect();
    const margin = containerRect.height * 0.4;
    const visible: number[] = [];
    pagesRef.current.forEach((el, index) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.bottom > containerRect.top - margin && rect.top < containerRect.bottom + margin) {
        visible.push(index + 1);
      }
    });
    return visible;
  }

  function near(pageNumber: number, anchors: Set<number>, distance: number): boolean {
    for (const anchor of anchors) {
      if (Math.abs(anchor - pageNumber) <= distance) return true;
    }
    return false;
  }

  function cancelPage(pageNumber: number) {
    const state = pageStates.current.get(pageNumber);
    if (!state) return;
    state.task?.cancel();
    state.task = undefined;
    state.status = "idle";
    state.page?.cleanup();
    state.page = undefined;
    mountsRef.current[pageNumber - 1]?.replaceChildren();
    setRenderedPages((prev) => prev.filter((page) => page !== pageNumber));
    setStats((prev) => ({ ...prev, cancelled: prev.cancelled + 1 }));
  }

  function unloadPage(pageNumber: number) {
    const state = pageStates.current.get(pageNumber);
    if (!state || state.status !== "rendered") return;
    state.status = "idle";
    state.page?.cleanup();
    state.page = undefined;
    mountsRef.current[pageNumber - 1]?.replaceChildren();
    setRenderedPages((prev) => prev.filter((page) => page !== pageNumber));
  }

  function schedule() {
    const currentLayout = layoutRef.current;
    const container = scrollRef.current;
    if (!currentLayout || !container) return;

    const visibleList = computeVisible();
    const anchors = new Set(visibleList.length > 0 ? visibleList : [1, 2, 3]);
    const desired = new Set<number>();
    for (const anchor of anchors) {
      for (let offset = -2; offset <= 2; offset += 1) {
        const pageNumber = anchor + offset;
        if (pageNumber >= 1 && pageNumber <= currentLayout.pageCount) desired.add(pageNumber);
      }
    }

    for (const [pageNumber, state] of pageStates.current) {
      if (state.status === "rendering" && !near(pageNumber, anchors, 4)) {
        cancelPage(pageNumber);
      }
      if (state.status === "rendered" && !near(pageNumber, anchors, 7)) {
        unloadPage(pageNumber);
      }
    }

    const center = container.scrollTop + container.clientHeight / 2;
    const distance = (pageNumber: number) => {
      const el = pagesRef.current[pageNumber - 1];
      if (!el) return Number.POSITIVE_INFINITY;
      return Math.abs(el.offsetTop + el.offsetHeight / 2 - center);
    };

    queueRef.current = [...desired]
      .filter((pageNumber) => pageStates.current.get(pageNumber)?.status === "idle")
      .sort((a, b) => distance(a) - distance(b));

    pump();
  }

  scheduleRef.current = schedule;

  useEffect(() => {
    loadStartedAt.current = performance.now();
    let disposed = false;

    const load = async () => {
      try {
        const loadingTask = getDocument({
          url: tenderPdfUrl,
          disableAutoFetch: true,
          disableStream: false,
        });
        loadingTaskRef.current = loadingTask;
        const doc = await loadingTask.promise;
        if (disposed) {
          void loadingTask.destroy();
          return;
        }
        docRef.current = doc;
        const first = await doc.getPage(1);
        const viewport = first.getViewport({ scale: 1 });
        const next = { pageCount: doc.numPages, ratio: viewport.height / viewport.width };
        first.cleanup();
        if (disposed) return;
        layoutRef.current = next;
        setLayout(next);
        patchStats({ total: doc.numPages });
      } catch (err) {
        if (!disposed) setError(`PDF 加载失败：${String(err)}`);
      }
    };

    void load();
    return () => {
      disposed = true;
      for (const state of pageStates.current.values()) {
        state.task?.cancel();
      }
      pageStates.current.clear();
      void loadingTaskRef.current?.destroy();
      loadingTaskRef.current = null;
      docRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!layout) return;
    const map = new Map<number, PageState>();
    for (let pageNumber = 1; pageNumber <= layout.pageCount; pageNumber += 1) {
      map.set(pageNumber, { status: "idle" });
    }
    pageStates.current = map;
    loadedRef.current = new Set();
    firstRenderDone.current = false;
    setRenderedPages([]);
    const raf = requestAnimationFrame(() => scheduleRef.current());
    return () => cancelAnimationFrame(raf);
  }, [layout]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        scheduleRef.current();
      });
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      container.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    let raf = 0;
    let frames = 0;
    let last = performance.now();
    const loop = (now: number) => {
      frames += 1;
      if (now - last >= 500) {
        const fps = Math.min(120, Math.round((frames * 1000) / (now - last)));
        setStats((prev) => (prev.fps === fps ? prev : { ...prev, fps }));
        frames = 0;
        last = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!focus) return;
    const risk = RISKS.find((item) => item.id === focus.id);
    if (!risk) return;
    const container = scrollRef.current;
    const el = pagesRef.current[risk.page - 1];
    if (!container || !el) return;
    container.scrollTo({ top: Math.max(0, el.offsetTop - 14), behavior: "smooth" });
    const timer = window.setTimeout(() => scheduleRef.current(), 420);
    return () => window.clearTimeout(timer);
  }, [focus?.id, focus?.nonce]);

  return (
    <div className="pdf-viewer">
      <div className="pdf-toolbar">
        <span className="mono">ZC-2026-0118 · 招标文件</span>
        <span className="pdf-toolbar__meta mono">
          {layout ? `${layout.pageCount} 页 · A4` : "加载中…"} · Range 按需加载
        </span>
      </div>

      <div className="pdf-scroll" ref={scrollRef}>
        {error && <p className="pdf-error">{error}</p>}
        {!layout && !error && (
          <div className="pdf-loading">
            <span className="spinner" />
            正在通过 Range 请求打开文档…
          </div>
        )}

        {layout && (
          <div className="pdf-pages">
            {Array.from({ length: layout.pageCount }, (_, index) => {
              const pageNumber = index + 1;
              const pageRisks = RISKS.filter((risk) => risk.page === pageNumber);
              return (
                <div
                  key={pageNumber}
                  className="pdf-page"
                  style={{ aspectRatio: `1 / ${layout.ratio}` }}
                  ref={(el) => {
                    pagesRef.current[index] = el;
                  }}
                >
                  <div
                    className="pdf-canvas-mount"
                    ref={(el) => {
                      mountsRef.current[index] = el;
                    }}
                  />
                  {!renderedSet.has(pageNumber) && (
                    <div className="pdf-skeleton">
                      <span className="pdf-skeleton__page">第 {pageNumber} 页</span>
                      <span className="pdf-skeleton__hint">按需渲染 · 滚动到此处加载</span>
                    </div>
                  )}
                  {pageRisks.map((risk) => (
                    <button
                      type="button"
                      key={risk.id}
                      className={`pdf-risk pdf-risk--${risk.level}${
                        focus?.id === risk.id ? " pdf-risk--active" : ""
                      }`}
                      style={{
                        top: `${risk.rect.top}%`,
                        left: `${risk.rect.left}%`,
                        width: `${risk.rect.width}%`,
                        height: `${risk.rect.height}%`,
                      }}
                      onClick={() => onSelectRisk(risk.id)}
                      title={`${risk.id} · ${risk.title}`}
                    >
                      <span className="pdf-risk__label">
                        {risk.id}
                        {focus?.id === risk.id ? ` · ${RISK_LEVEL_LABEL[risk.level]}` : ""}
                      </span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showHud && layout && (
        <div className="pdf-hud" aria-live="polite">
          <div className="pdf-hud__row"><span>已加载</span><b>{stats.loaded}/{stats.total}</b></div>
          <div className="pdf-hud__row"><span>已渲染</span><b>{renderedPages.length}</b></div>
          <div className="pdf-hud__row"><span>滚动 FPS</span><b>{stats.fps}</b></div>
          <div className="pdf-hud__row"><span>取消任务</span><b>{stats.cancelled}</b></div>
          <div className="pdf-hud__row">
            <span>首屏</span>
            <b>{stats.firstRenderMs ? `${(stats.firstRenderMs / 1000).toFixed(2)}s` : "—"}</b>
          </div>
          <p className="pdf-hud__note">优先队列 · 并发 2 · 离开视口即取消</p>
        </div>
      )}
    </div>
  );
}
