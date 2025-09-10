'use client'

import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';
import { canvasAbsoluteMode } from '@grapesjs/studio-sdk-plugins';

export default function OverflowContainerScrollPage() {
    return (
        <div className="h-screen w-full">
            <StudioEditor
                onReady={(editor) => {
                    // Enable scrolling by setting zoom to 100% and allowing overflow
                    editor.on('load', () => {
                        const canvasEl = editor.Canvas.getElement();
                        const frame = editor.Canvas.getFrameEl();

                        // Set zoom to 100% to show slide at actual size
                        editor.Canvas.setZoom(100);

                        if (canvasEl) {
                            // Make the canvas scrollable and set background
                            canvasEl.style.overflow = 'auto';
                            canvasEl.style.background = '#f0f2f5';

                            // Remove any centering styles that might interfere with scrolling
                            const framesContainer = canvasEl.querySelector('.gjs-cv-canvas__frames');
                            if (framesContainer) {
                                (framesContainer as HTMLElement).style.display = 'block';
                                (framesContainer as HTMLElement).style.overflow = 'visible';
                            }
                        }

                        if (frame) {
                            // Ensure frame is large enough to contain the slide
                            frame.style.minWidth = '840px'; // Slide width + margins
                            frame.style.minHeight = '640px'; // Slide height + margins
                        }
                    });
                }}
                options={{
                    licenseKey: process.env.NEXT_PUBLIC_GRAPES_SDK_LICENSE_KEY || '',
                    plugins: [canvasAbsoluteMode],
                    project: {
                        default: {
                            pages: [
                                {
                                    name: 'Presentation',
                                    component: `
                                    <div class="slide-viewport">
                                        <div class="slide">
                                            <div style="position: absolute; top: 0; left: 550px; width: 300px; height: 100%; background-color: #baccec; transform: skewX(-12deg)"></div>
                                            <h1 style="position: absolute; top: 40px; left: 40px; font-size: 50px; margin: 0; font-weight: 700;">Overflow Scroll</h1>
                                            <p style="position: absolute; top: 135px; left: 40px; font-size: 22px; max-width: 450px; line-height: 1.5; color: #333;">Fixed 800x500px slide with scrollbars when content overflows viewport. Try resizing your browser window!</p>
                                            <ul data-gjs-type="text" style="position: absolute; top: 290px; left: 40px; font-size: 18px; line-height: 2; list-style: none; padding: 0;">
                                                <li>📏 Fixed slide dimensions</li>
                                                <li>📜 Scrollable when needed</li>
                                                <li>🖱️ Pan with scrollbars</li>
                                            </ul>
                                            <div style="position: absolute; left: 540px; top: 100px; width: 200px; height: 200px; background: rgba(255, 255, 255, 0.3); border-radius: 20px; backdrop-filter: blur(10px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; font-size: 80px;">📐</div>
                                            <div style="position: absolute; top: 405px; left: 590px; font-size: 14px; color: #555;">Studio SDK · GrapesJS</div>
                                        </div>
                                    </div>
                                    <style>
                                        body {
                                            margin: 0;
                                            font-family: system-ui;
                                            background: #f0f2f5;
                                        }
                                        .slide-viewport {
                                            width: 100%;
                                            height: 100vh;
                                            overflow: auto;
                                            display: flex;
                                            justify-content: flex-start;
                                            align-items: flex-start;
                                            padding: 20px;
                                            box-sizing: border-box;
                                        }
                                        .slide {
                                            flex-shrink: 0;
                                            width: 800px;
                                            height: 500px;
                                            position: relative;
                                            background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
                                            color: #1a1a1a;
                                            border-radius: 12px;
                                            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                                            overflow: hidden;
                                        }
                                    </style>
                                  `,
                                }
                            ]
                        }
                    }
                }}
            />
        </div>
    )
}
