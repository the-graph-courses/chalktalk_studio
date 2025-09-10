'use client'

import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';
import { canvasAbsoluteMode } from '@grapesjs/studio-sdk-plugins';
import zoomPlugin from '@/lib/zoom-plugin';

export default function CustomZoomControlsPage() {
    return (
        <div className="h-screen w-full">
            <StudioEditor
                options={{
                    licenseKey: process.env.NEXT_PUBLIC_GRAPES_SDK_LICENSE_KEY || '',
                    plugins: [canvasAbsoluteMode, zoomPlugin],
                    project: {
                        default: {
                            pages: [
                                {
                                    name: 'Presentation',
                                    component: `
                                    <div style="position: relative; width: 800px; height: 500px; margin: 70px auto 0; background: linear-gradient(135deg, #f5f7fa, #c3cfe2); color: #1a1a1a; border-radius: 12px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1); overflow: hidden;">
                                      <div style="position: absolute; top: 0; left: 550px; width: 300px; height: 100%; background-color: #baccec; transform: skewX(-12deg)"></div>
                                      <h1 style="position: absolute; top: 40px; left: 40px; font-size: 50px; margin: 0; font-weight: 700;">Custom Zoom Controls</h1>
                                      <p style="position: absolute; top: 135px; left: 40px; font-size: 22px; max-width: 450px; line-height: 1.5; color: #333;">Use toolbar buttons, keyboard shortcuts (Shift + / Shift -), or Ctrl/Cmd + scroll wheel to zoom.</p>
                                      <ul data-gjs-type="text" style="position: absolute; top: 290px; left: 40px; font-size: 18px; line-height: 2; list-style: none; padding: 0;">
                                        <li>🔍 Zoom buttons in toolbar</li>
                                        <li>⌨️ Keyboard shortcuts</li>
                                        <li>🖱️ Mouse wheel zoom</li>
                                        <li>📐 Fit to screen button</li>
                                      </ul>
                                      <div style="position: absolute; left: 540px; top: 100px; width: 200px; height: 200px; background: rgba(255, 255, 255, 0.3); border-radius: 20px; backdrop-filter: blur(10px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; font-size: 80px;">🔍</div>
                                      <div style="position: absolute; top: 405px; left: 590px; font-size: 14px; color: #555;">Studio SDK · GrapesJS</div>
                                    </div>
                                    <style>
                                        body {
                                            font-family: system-ui;
                                            background: #f0f2f5;
                                            margin: 20px;
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
