// Templates following the Studio SDK format with embedded CSS styles
// Based on the documentation examples that use <style> tags within component HTML

/**
 * Elegant single-color templates with unique fonts.
 * Each template uses embedded CSS styles and distinct typography to create variety.
 */
export const TEMPLATES = [
    {
        id: 'title-clean-white',
        name: 'Clean White (Modern)',
        data: {
            pages: [
                {
                    name: 'Presentation',
                    component: `
                        <div class="slide-container modern-slide">
                            <h1 class="slide-title">Your Title Here</h1>
                            <p class="slide-subtitle">A subtitle or brief description of your presentation</p>
                        </div>
                        <style>
                            .modern-slide {
                                position: absolute;
                                width: 800px;
                                height: 450px;
                                top: 50%;
                                left: 50%;
                                transform: translate(-50%, -50%);
                                padding: 10px;
                                background-color: #ffffff;
                                border-radius: 8px;
                                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                                overflow: visible;
                                border: 1px solid rgba(0, 0, 0, 0.1);
                            }
                            .modern-slide .slide-title {
                                position: absolute;
                                top: 200px;
                                left: 100px;
                                font-size: 80px;
                                margin: 0;
                                font-weight: 700;
                                color: #2c3e50;
                                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                            }
                            .modern-slide .slide-subtitle {
                                position: absolute;
                                top: 320px;
                                left: 100px;
                                font-size: 32px;
                                max-width: 600px;
                                line-height: 1.5;
                                color: #555;
                                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                                font-weight: 300;
                                margin: 0;
                            }
                        </style>
                    `
                }
            ]
        }
    },
    {
        id: 'title-slate-blue',
        name: 'Slate Blue (Professional)',
        data: {
            pages: [
                {
                    name: 'Presentation',
                    component: `
                        <div class="slide-container professional-slide">
                            <h1 class="slide-title">Your Title Here</h1>
                            <p class="slide-subtitle">A subtitle or brief description of your presentation</p>
                        </div>
                        <style>
                            .professional-slide {
                                position: absolute;
                                width: 800px;
                                height: 450px;
                                top: 50%;
                                left: 50%;
                                transform: translate(-50%, -50%);
                                padding: 10px;
                                background-color: #e8f4f8;
                                border-radius: 8px;
                                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                                overflow: visible;
                                border: 1px solid rgba(0, 0, 0, 0.1);
                            }
                            .professional-slide .slide-title {
                                position: absolute;
                                top: 200px;
                                left: 100px;
                                font-size: 80px;
                                margin: 0;
                                font-weight: 700;
                                color: #1a1a1a;
                                font-family: 'Georgia', 'Times New Roman', serif;
                            }
                            .professional-slide .slide-subtitle {
                                position: absolute;
                                top: 320px;
                                left: 100px;
                                font-size: 32px;
                                max-width: 600px;
                                line-height: 1.5;
                                color: #444;
                                font-family: 'Georgia', 'Times New Roman', serif;
                                font-weight: 400;
                                margin: 0;
                            }
                        </style>
                    `
                }
            ]
        }
    },
    {
        id: 'title-charcoal',
        name: 'Charcoal (Minimal)',
        data: {
            pages: [
                {
                    name: 'Presentation',
                    component: `
                        <div class="slide-container minimal-slide">
                            <h1 class="slide-title">Your Title Here</h1>
                            <p class="slide-subtitle">A subtitle or brief description of your presentation</p>
                        </div>
                        <style>
                            .minimal-slide {
                                position: absolute;
                                width: 800px;
                                height: 450px;
                                top: 50%;
                                left: 50%;
                                transform: translate(-50%, -50%);
                                padding: 10px;
                                background-color: #2c3e50;
                                border-radius: 8px;
                                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                                overflow: visible;
                                border: 1px solid rgba(0, 0, 0, 0.1);
                            }
                            .minimal-slide .slide-title {
                                position: absolute;
                                top: 200px;
                                left: 100px;
                                font-size: 80px;
                                margin: 0;
                                font-weight: 300;
                                color: #ffffff;
                                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                                letter-spacing: -2px;
                            }
                            .minimal-slide .slide-subtitle {
                                position: absolute;
                                top: 320px;
                                left: 100px;
                                font-size: 32px;
                                max-width: 600px;
                                line-height: 1.5;
                                color: #f0f0f0;
                                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                                font-weight: 200;
                                margin: 0;
                            }
                        </style>
                    `
                }
            ]
        }
    },
    {
        id: 'title-sage-green',
        name: 'Sage Green (Elegant)',
        data: {
            pages: [
                {
                    name: 'Presentation',
                    component: `
                        <div class="slide-container elegant-slide">
                            <h1 class="slide-title">Your Title Here</h1>
                            <p class="slide-subtitle">A subtitle or brief description of your presentation</p>
                        </div>
                        <style>
                            .elegant-slide {
                                position: absolute;
                                width: 800px;
                                height: 450px;
                                top: 50%;
                                left: 50%;
                                transform: translate(-50%, -50%);
                                padding: 10px;
                                background-color: #f0f4f0;
                                border-radius: 8px;
                                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                                overflow: visible;
                                border: 1px solid rgba(0, 0, 0, 0.1);
                            }
                            .elegant-slide .slide-title {
                                position: absolute;
                                top: 200px;
                                left: 100px;
                                font-size: 80px;
                                margin: 0;
                                font-weight: 600;
                                color: #2c3e50;
                                font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
                            }
                            .elegant-slide .slide-subtitle {
                                position: absolute;
                                top: 320px;
                                left: 100px;
                                font-size: 32px;
                                max-width: 600px;
                                line-height: 1.5;
                                color: #555;
                                font-family: 'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif;
                                font-weight: 400;
                                margin: 0;
                            }
                        </style>
                    `
                }
            ]
        }
    },
    {
        id: 'title-warm-cream',
        name: 'Warm Cream (Classic)',
        data: {
            pages: [
                {
                    name: 'Presentation',
                    component: `
                        <div class="slide-container classic-slide">
                            <h1 class="slide-title">Your Title Here</h1>
                            <p class="slide-subtitle">A subtitle or brief description of your presentation</p>
                        </div>
                        <style>
                            .classic-slide {
                                position: absolute;
                                width: 800px;
                                height: 450px;
                                top: 50%;
                                left: 50%;
                                transform: translate(-50%, -50%);
                                padding: 10px;
                                background-color: #faf7f2;
                                border-radius: 8px;
                                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                                overflow: visible;
                                border: 1px solid rgba(0, 0, 0, 0.1);
                            }
                            .classic-slide .slide-title {
                                position: absolute;
                                top: 200px;
                                left: 100px;
                                font-size: 80px;
                                margin: 0;
                                font-weight: 700;
                                color: #8b4513;
                                font-family: 'Playfair Display', Georgia, serif;
                            }
                            .classic-slide .slide-subtitle {
                                position: absolute;
                                top: 320px;
                                left: 100px;
                                font-size: 32px;
                                max-width: 600px;
                                line-height: 1.5;
                                color: #654321;
                                font-family: 'Source Sans Pro', -apple-system, BlinkMacSystemFont, sans-serif;
                                font-weight: 400;
                                margin: 0;
                            }
                        </style>
                    `
                }
            ]
        }
    }
];
