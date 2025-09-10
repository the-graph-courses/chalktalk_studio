export default function zoomPlugin(editor: any, opts: any = {}) {
    const options = {
        // default options
        zoomInKey: ['ctrl', '='],
        zoomOutKey: ['ctrl', '-'],
        panelCategory: "views-container",
        ...opts
    };

    // Add zoom out button
    editor.Panels.addButton(options.panelCategory, {
        id: 'zoom-out',
        className: 'fa fa-minus',
        command: 'zoom-out',
        attributes: { title: 'Zoom Out' }
    });

    // Add zoom in button
    editor.Panels.addButton(options.panelCategory, {
        id: 'zoom-in',
        className: 'fa fa-plus',
        command: 'zoom-in',
        attributes: { title: 'Zoom In' }
    });

    // Add fit button
    editor.Panels.addButton(options.panelCategory, {
        id: 'fit-to-slide',
        className: 'fa fa-arrows-alt',
        command: 'fit-to-slide',
        attributes: { title: 'Fit slide to screen' }
    });

    // Zoom in command
    editor.Commands.add('zoom-in', {
        run: () => {
            const zoom = editor.Canvas.getZoom();
            const newZoom = Math.min(zoom + 10, 300); // Max 300%
            editor.Canvas.setZoom(newZoom);
        }
    });

    // Zoom out command
    editor.Commands.add('zoom-out', {
        run: () => {
            const zoom = editor.Canvas.getZoom();
            const newZoom = Math.max(zoom - 10, 10); // Min 10%
            editor.Canvas.setZoom(newZoom);
        }
    });

    // Fit to slide command
    editor.Commands.add('fit-to-slide', {
        run: () => {
            const canvasEl = editor.Canvas.getElement();
            if (canvasEl) {
                const gap = 40;
                const vw = canvasEl.clientWidth;
                const vh = canvasEl.clientHeight;
                const sw = 800; // Fixed slide width
                const sh = 500; // Fixed slide height

                const scale = Math.min((vw - gap) / sw, (vh - gap) / sh, 1);
                editor.Canvas.setZoom(scale * 100);
            }
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function (event) {
        // Shift + = for zoom in
        if (event.shiftKey && (event.keyCode === 187 || event.keyCode === 107)) {
            event.preventDefault();
            editor.runCommand('zoom-in');
        }
        // Shift + - for zoom out
        if (event.shiftKey && (event.key === '-' || event.key === '_')) {
            event.preventDefault();
            editor.runCommand('zoom-out');
        }
    });

    // Mouse wheel zoom (Ctrl/Cmd + scroll)
    const canvasEl = editor.Canvas.getElement();
    if (canvasEl) {
        const handleWheelZoom = (event: WheelEvent) => {
            if (event.ctrlKey || event.metaKey) {
                event.preventDefault();
                const delta = event.deltaY;
                const zoom = editor.Canvas.getZoom();

                let newZoom;
                if (delta < 0) {
                    newZoom = Math.min(zoom + 5, 300); // Zoom in
                } else {
                    newZoom = Math.max(zoom - 5, 10); // Zoom out
                }

                editor.Canvas.setZoom(newZoom);
            }
        };

        canvasEl.addEventListener('wheel', handleWheelZoom, { passive: false });
    }
}

