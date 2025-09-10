export const SLIDE_FORMATS = {
    PRESENTATION_16_9: {
        id: '16:9',
        name: 'Presentation (16:9)',
        width: 1920,
        height: 1080,
    },
    PRESENTATION_4_3: {
        id: '4:3',
        name: 'Presentation (4:3)',
        width: 1440,
        height: 1080,
    },
    // Add other formats here in the future
    // e.g., A4_DOCUMENT, etc.
};

export const DEFAULT_SLIDE_FORMAT = SLIDE_FORMATS.PRESENTATION_16_9;

// This function creates a slide container in the absolute positioning style
export const getSlideContainer = (
    content: string,
    format = DEFAULT_SLIDE_FORMAT,
    customStyles: Record<string, string> = {}
) => {
    const defaultStyles = {
        position: 'relative',
        width: `${format.width}px`,
        height: `${format.height}px`,
        margin: '50px auto',
        padding: '10px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        overflow: 'visible',
        border: '1px solid rgba(0, 0, 0, 0.1)',
    };

    const combinedStyles = { ...defaultStyles, ...customStyles };

    // Convert camelCase to kebab-case for CSS properties
    const styleString = Object.entries(combinedStyles)
        .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}:${value}`)
        .join(';');

    return `
        <div
            data-slide-container="true"
            data-slide-format-id="${format.id}"
            draggable="false"
            style="${styleString}"
        >
            ${content}
        </div>
    `;
};
