export const SLIDE_FORMATS = {
    PRESENTATION_16_9: {
        id: '16:9',
        name: 'Presentation (16:9)',
        width: 1280,
        height: 720,
    },
    PRESENTATION_4_3: {
        id: '4:3',
        name: 'Presentation (4:3)',
        width: 1024,
        height: 768,
    },
    // Add other formats here in the future
    // e.g., A4_DOCUMENT, etc.
};

export const DEFAULT_SLIDE_FORMAT = SLIDE_FORMATS.PRESENTATION_16_9;

// This function creates a slide container compatible with the fullsize canvas plugin
export const getSlideContainer = (
    content: string,
    format = DEFAULT_SLIDE_FORMAT,
    customStyles: Record<string, string> = {},
) => {
    const slideStyles = {
        position: 'absolute',
        top: '0',
        left: '0',
        width: `${format.width}px`,
        height: `${format.height}px`,
        backgroundColor: 'white',
        overflow: 'visible',
        ...customStyles,
    };

    const bodyStyles = {
        margin: '0',
        padding: '0',
        position: 'relative',
        width: `${format.width}px`,
        minHeight: `${format.height}px`,
        background: '#f3f4f6',
        overflow: 'hidden',
    };

    const toCss = (styles: Record<string, string>) =>
        Object.entries(styles)
            .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}:${value}`)
            .join(';');

    return `
        <div
            data-slide-container="true"
            data-slide-format-id="${format.id}"
            draggable="false"
            style="${toCss(slideStyles)}"
        >
            ${content}
        </div>
        <style>body { ${toCss(bodyStyles)} }</style>
    `;
};

