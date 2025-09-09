// marquee-select.ts
import type { Editor } from 'grapesjs';

const marqueeSelect = (editor: Editor) => {
    let active = false;
    let start: { x: number; y: number } | null = null;
    let boxEl: HTMLDivElement | null = null;

    // Helpers to work inside the iframe
    const getDoc = () => editor.Canvas.getDocument();
    const getBody = () => editor.Canvas.getBody();

    const createBox = () => {
        const el = getDoc().createElement('div');
        Object.assign(el.style, {
            position: 'fixed', // inside iframe viewport coords
            left: '0px', top: '0px', width: '0px', height: '0px',
            border: '1px dashed #3b82f6',
            background: 'rgba(59,130,246,0.1)',
            zIndex: '999999',
            pointerEvents: 'none',
        });
        getBody().appendChild(el);
        return el;
    };

    const onPointerDown = (e: PointerEvent) => {
        // Only start marquee when Shift is held (avoids fighting native selection/resize)
        if (!active || !e.shiftKey) return;

        // Ignore drags that start on tools/handles
        const t = e.target as HTMLElement;
        if (t.closest('.gjs-tools, .gjs-toolbar, .gjs-resizer, .gjs-badge')) return;

        start = { x: e.clientX, y: e.clientY };
        boxEl = createBox();
        getDoc().addEventListener('pointermove', onPointerMove, { passive: true });
        getDoc().addEventListener('pointerup', onPointerUp, { once: true });
    };

    const onPointerMove = (e: PointerEvent) => {
        if (!start || !boxEl) return;
        const x1 = Math.min(start.x, e.clientX);
        const y1 = Math.min(start.y, e.clientY);
        const x2 = Math.max(start.x, e.clientX);
        const y2 = Math.max(start.y, e.clientY);
        Object.assign(boxEl.style, {
            left: `${x1}px`, top: `${y1}px`,
            width: `${x2 - x1}px`, height: `${y2 - y1}px`,
        });
    };

    const rectsOverlap = (a: DOMRect, b: DOMRect) =>
        !(a.right < b.left || b.right < a.left || a.bottom < b.top || b.bottom < a.top);

    const onPointerUp = () => {
        if (!start || !boxEl) return;

        const boxRect = boxEl.getBoundingClientRect();

        // Fresh selection (hold Shift to start marquee; if you want additive marquee, remove this clear)
        const prev = editor.getSelectedAll();
        if (prev.length) editor.selectRemove(prev); // clear current selection via remove loop
        // (selectAdd/Remove/getSelectedAll documented in Editor API) :contentReference[oaicite:4]{index=4}

        // Walk all rendered components
        const wrapper = editor.getWrapper();
        if (!wrapper) return; // Exit if no wrapper available
        const comps = wrapper.find('*'); // Component API "find" returns array of components. :contentReference[oaicite:5]{index=5}
        for (const cmp of comps) {
            if (!cmp.get('selectable')) continue;
            const el = cmp.getEl?.() as HTMLElement | undefined;
            if (!el || !el.offsetParent) continue; // skip hidden/non-rendered
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) continue;
            if (rectsOverlap(boxRect, r)) editor.selectAdd(cmp); // add to selection set
        }

        // cleanup
        boxEl.remove();
        boxEl = null;
        start = null;
        getDoc().removeEventListener('pointermove', onPointerMove);
    };

    // Toggle command so you can bind a toolbar button or hotkey
    editor.Commands.add('marquee-select:toggle', {
        run() { active = true; },
        stop() {
            active = false;
            if (boxEl) boxEl.remove();
            boxEl = null;
            start = null;
        },
    });

    // Attach listeners once the frame body is ready (Canvas API event)
    editor.on('canvas:frame:load:body', () => {
        getBody().addEventListener('pointerdown', onPointerDown, true);
    });
};

export default marqueeSelect;
