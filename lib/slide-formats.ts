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
    // Additional formats can be added here
};

export const DEFAULT_SLIDE_FORMAT = SLIDE_FORMATS.PRESENTATION_16_9;

// Wrap simple content into a complete slide where the body element represents
// the slide itself. Styles are applied directly to the body so that absolute
// positioning works as expected for child elements.
export const getSlideContainer = (
    content: string,
    format = DEFAULT_SLIDE_FORMAT,
    customStyles: Record<string, string> = {},
) => {
    const defaultStyles = {
        width: `${format.width}px`,
        height: `${format.height}px`,
        backgroundColor: 'white',
    };

    const combinedStyles = { ...defaultStyles, ...customStyles };

    const styleString = Object.entries(combinedStyles)
        .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}:${value}`)
        .join(';');

    return `
        ${content}
        <style>
            body { ${styleString} }
        </style>
    `;
};

// Helper used by server/client to ensure slides use the configured format
export const enforceBodyDimensions = (html: string, format = DEFAULT_SLIDE_FORMAT) => {
    return html.replace(/body\s*{[^}]*}/, (match) => {
        return match
            .replace(/width:\s*\d+px/, `width: ${format.width}px`)
            .replace(/height:\s*\d+px/, `height: ${format.height}px`);
    });
};

