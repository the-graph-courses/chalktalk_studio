import { getSlideContainer, DEFAULT_SLIDE_FORMAT } from './slide-formats';

// Templates following the Studio SDK format with embedded CSS styles
export const TEMPLATES = [
    {
        id: 'title-clean-white',
        name: 'Clean White (Modern)',
        revealTheme: 'white',
        data: {
            pages: [
                {
                    name: 'Presentation',
                    component:
                        getSlideContainer(
                            `
                            <h1 class="slide-title">Your Title Here</h1>
                            <p class="slide-subtitle">A subtitle or brief description of your presentation</p>
                            `,
                            DEFAULT_SLIDE_FORMAT,
                            {
                                padding: '20px',
                                backgroundColor: '#ffffff',
                                borderRadius: '12px',
                                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                                overflow: 'visible',
                                border: '1px solid rgba(0, 0, 0, 0.1)',
                            },
                        ) + `
                        <style>
                            .slide-title {
                                position: absolute;
                                top: 260px;
                                left: 100px;
                                font-size: 48px;
                                margin: 0;
                                font-weight: 700;
                                color: #2c3e50;
                                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                            }
                            .slide-subtitle {
                                position: absolute;
                                top: 340px;
                                left: 100px;
                                font-size: 24px;
                                max-width: 1080px;
                                line-height: 1.5;
                                color: #555;
                                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                                font-weight: 300;
                                margin: 0;
                            }
                        </style>
                    `,
                },
            ],
        },
    },
    {
        id: 'title-slate-blue',
        name: 'Slate Blue (Professional)',
        revealTheme: 'white',
        data: {
            pages: [
                {
                    name: 'Presentation',
                    component:
                        getSlideContainer(
                            `
                            <h1 class="slide-title">Your Title Here</h1>
                            <p class="slide-subtitle">A subtitle or brief description of your presentation</p>
                            `,
                            DEFAULT_SLIDE_FORMAT,
                            {
                                padding: '20px',
                                backgroundColor: '#e8f4f8',
                                borderRadius: '12px',
                                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                                overflow: 'visible',
                                border: '1px solid rgba(0, 0, 0, 0.1)',
                            },
                        ) + `
                        <style>
                            .slide-title {
                                position: absolute;
                                top: 260px;
                                left: 100px;
                                font-size: 52px;
                                margin: 0;
                                font-weight: 700;
                                color: #1a1a1a;
                                font-family: 'Georgia', 'Times New Roman', serif;
                            }
                            .slide-subtitle {
                                position: absolute;
                                top: 340px;
                                left: 100px;
                                font-size: 25px;
                                max-width: 1080px;
                                line-height: 1.5;
                                color: #444;
                                font-family: 'Georgia', 'Times New Roman', serif;
                                font-weight: 400;
                                margin: 0;
                            }
                        </style>
                    `,
                },
            ],
        },
    },
    {
        id: 'title-charcoal',
        name: 'Charcoal (Minimal)',
        revealTheme: 'black',
        data: {
            pages: [
                {
                    name: 'Presentation',
                    component:
                        getSlideContainer(
                            `
                            <h1 class="slide-title">Your Title Here</h1>
                            <p class="slide-subtitle">A subtitle or brief description of your presentation</p>
                            `,
                            DEFAULT_SLIDE_FORMAT,
                            {
                                padding: '20px',
                                backgroundColor: '#2c3e50',
                                borderRadius: '12px',
                                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                                overflow: 'visible',
                                border: '1px solid rgba(0, 0, 0, 0.1)',
                            },
                        ) + `
                        <style>
                            .slide-title {
                                position: absolute;
                                top: 260px;
                                left: 100px;
                                font-size: 47px;
                                margin: 0;
                                font-weight: 300;
                                color: #ffffff;
                                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                                letter-spacing: -1px;
                            }
                            .slide-subtitle {
                                position: absolute;
                                top: 330px;
                                left: 100px;
                                font-size: 24px;
                                max-width: 1080px;
                                line-height: 1.5;
                                color: #f0f0f0;
                                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                                font-weight: 200;
                                margin: 0;
                            }
                        </style>
                    `,
                },
            ],
        },
    },
    {
        id: 'title-sage-green',
        name: 'Sage Green (Elegant)',
        revealTheme: 'white',
        data: {
            pages: [
                {
                    name: 'Presentation',
                    component:
                        getSlideContainer(
                            `
                            <h1 class="slide-title">Your Title Here</h1>
                            <p class="slide-subtitle">A subtitle or brief description of your presentation</p>
                            `,
                            DEFAULT_SLIDE_FORMAT,
                            {
                                padding: '20px',
                                backgroundColor: '#f0f4f0',
                                borderRadius: '12px',
                                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                                overflow: 'visible',
                                border: '1px solid rgba(0, 0, 0, 0.1)',
                            },
                        ) + `
                        <style>
                            .slide-title {
                                position: absolute;
                                top: 260px;
                                left: 100px;
                                font-size: 50px;
                                margin: 0;
                                font-weight: 600;
                                color: #2c3e50;
                                font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
                            }
                            .slide-subtitle {
                                position: absolute;
                                top: 335px;
                                left: 100px;
                                font-size: 24px;
                                max-width: 1080px;
                                line-height: 1.5;
                                color: #555;
                                font-family: 'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif;
                                font-weight: 400;
                                margin: 0;
                            }
                        </style>
                    `,
                },
            ],
        },
    },
    {
        id: 'title-warm-cream',
        name: 'Warm Cream (Classic)',
        revealTheme: 'serif',
        data: {
            pages: [
                {
                    name: 'Presentation',
                    component:
                        getSlideContainer(
                            `
                            <h1 class="slide-title">Your Title Here</h1>
                            <p class="slide-subtitle">A subtitle or brief description of your presentation</p>
                            `,
                            DEFAULT_SLIDE_FORMAT,
                            {
                                padding: '20px',
                                backgroundColor: '#faf7f2',
                                borderRadius: '12px',
                                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                                overflow: 'visible',
                                border: '1px solid rgba(0, 0, 0, 0.1)',
                            },
                        ) + `
                        <style>
                            .slide-title {
                                position: absolute;
                                top: 260px;
                                left: 100px;
                                font-size: 53px;
                                margin: 0;
                                font-weight: 700;
                                color: #8b4513;
                                font-family: 'Playfair Display', Georgia, serif;
                            }
                            .slide-subtitle {
                                position: absolute;
                                top: 340px;
                                left: 100px;
                                font-size: 25px;
                                max-width: 1080px;
                                line-height: 1.5;
                                color: #654321;
                                font-family: 'Source Sans Pro', -apple-system, BlinkMacSystemFont, sans-serif;
                                font-weight: 400;
                                margin: 0;
                            }
                        </style>
                    `,
                },
            ],
        },
    },
];
