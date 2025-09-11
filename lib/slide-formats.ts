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
    format = DEFAULT_SLIDE_FORMAT
) => {
    return `
        <!-- Slide container that exactly matches body dimensions -->
        <div id="slide-container" data-slide-container="true" data-slide-format-id="${format.id}" style="position: absolute; top: 0; left: 0; width: ${format.width}px; height: ${format.height}px; background: white; overflow: visible;">
            ${content}
        </div>
        
        <style>
            body {
                margin: 0;
                padding: 0;
                position: relative;
                width: ${format.width}px;
                min-height: ${format.height}px;
                background: #f3f4f6;
                overflow: hidden;
            }
        </style>
    `;
};
