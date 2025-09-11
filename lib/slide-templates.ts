// Templates following the Studio SDK format with embedded CSS styles
// Based on the documentation examples that use <style> tags within component HTML

/**
 * Elegant single-color templates with unique fonts.
 * Each template uses embedded CSS styles and distinct typography to create variety.
 * Updated for larger slide dimensions (1280x720) for better zoom behavior.
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
                        <!-- Slide container that exactly matches body dimensions -->
                        <div id="slide-container" style="position: absolute; top: 0; left: 0; width: 1920px; height: 1080px; background: #ffffff; overflow: visible;">
                            <h1 class="slide-title">Your Title Here</h1>
                            <p class="slide-subtitle">A subtitle or brief description of your presentation</p>
                        </div>
                        <style>
                            body {
                                margin: 0;
                                padding: 0;
                                position: relative;
                                width: 1920px;
                                min-height: 1080px;
                                background: #f3f4f6;
                                overflow: hidden;
                            }
                            .slide-title {
                                position: absolute;
                                top: 400px;
                                left: 150px;
                                font-size: 72px;
                                margin: 0;
                                font-weight: 700;
                                color: #2c3e50;
                                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                            }
                            .slide-subtitle {
                                position: absolute;
                                top: 520px;
                                left: 150px;
                                font-size: 36px;
                                max-width: 1620px;
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
                        <!-- Slide container that exactly matches body dimensions -->
                        <div id="slide-container" style="position: absolute; top: 0; left: 0; width: 1920px; height: 1080px; background: #e8f4f8; overflow: visible;">
                            <h1 class="slide-title">Your Title Here</h1>
                            <p class="slide-subtitle">A subtitle or brief description of your presentation</p>
                        </div>
                        <style>
                            body {
                                margin: 0;
                                padding: 0;
                                position: relative;
                                width: 1920px;
                                min-height: 1080px;
                                background: #f3f4f6;
                                overflow: hidden;
                            }
                            .slide-title {
                                position: absolute;
                                top: 400px;
                                left: 150px;
                                font-size: 78px;
                                margin: 0;
                                font-weight: 700;
                                color: #1a1a1a;
                                font-family: 'Georgia', 'Times New Roman', serif;
                            }
                            .slide-subtitle {
                                position: absolute;
                                top: 520px;
                                left: 150px;
                                font-size: 38px;
                                max-width: 1620px;
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
                        <!-- Slide container that exactly matches body dimensions -->
                        <div id="slide-container" style="position: absolute; top: 0; left: 0; width: 1920px; height: 1080px; background: #2c3e50; overflow: visible;">
                            <h1 class="slide-title">Your Title Here</h1>
                            <p class="slide-subtitle">A subtitle or brief description of your presentation</p>
                        </div>
                        <style>
                            body {
                                margin: 0;
                                padding: 0;
                                position: relative;
                                width: 1920px;
                                min-height: 1080px;
                                background: #f3f4f6;
                                overflow: hidden;
                            }
                            .slide-title {
                                position: absolute;
                                top: 400px;
                                left: 150px;
                                font-size: 70px;
                                margin: 0;
                                font-weight: 300;
                                color: #ffffff;
                                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                                letter-spacing: -1px;
                            }
                            .slide-subtitle {
                                position: absolute;
                                top: 500px;
                                left: 150px;
                                font-size: 36px;
                                max-width: 1620px;
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
                        <!-- Slide container that exactly matches body dimensions -->
                        <div id="slide-container" style="position: absolute; top: 0; left: 0; width: 1920px; height: 1080px; background: #f0f4f0; overflow: visible;">
                            <h1 class="slide-title">Your Title Here</h1>
                            <p class="slide-subtitle">A subtitle or brief description of your presentation</p>
                        </div>
                        <style>
                            body {
                                margin: 0;
                                padding: 0;
                                position: relative;
                                width: 1920px;
                                min-height: 1080px;
                                background: #f3f4f6;
                                overflow: hidden;
                            }
                            .slide-title {
                                position: absolute;
                                top: 400px;
                                left: 150px;
                                font-size: 75px;
                                margin: 0;
                                font-weight: 600;
                                color: #2c3e50;
                                font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
                            }
                            .slide-subtitle {
                                position: absolute;
                                top: 510px;
                                left: 150px;
                                font-size: 36px;
                                max-width: 1620px;
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
                        <!-- Slide container that exactly matches body dimensions -->
                        <div id="slide-container" style="position: absolute; top: 0; left: 0; width: 1920px; height: 1080px; background: #faf7f2; overflow: visible;">
                            <h1 class="slide-title">Your Title Here</h1>
                            <p class="slide-subtitle">A subtitle or brief description of your presentation</p>
                        </div>
                        <style>
                            body {
                                margin: 0;
                                padding: 0;
                                position: relative;
                                width: 1920px;
                                min-height: 1080px;
                                background: #f3f4f6;
                                overflow: hidden;
                            }
                            .slide-title {
                                position: absolute;
                                top: 400px;
                                left: 150px;
                                font-size: 80px;
                                margin: 0;
                                font-weight: 700;
                                color: #8b4513;
                                font-family: 'Playfair Display', Georgia, serif;
                            }
                            .slide-subtitle {
                                position: absolute;
                                top: 520px;
                                left: 150px;
                                font-size: 38px;
                                max-width: 1620px;
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
