'use client'

import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';
import { canvasAbsoluteMode, canvasFullSize } from '@grapesjs/studio-sdk-plugins';

export default function FullSizeAbsoluteDemoPage() {
    return (
        <div className="h-screen w-full">
            <StudioEditor
                options={{
                    licenseKey: process.env.NEXT_PUBLIC_GRAPES_SDK_LICENSE_KEY || '',
                    plugins: [
                        canvasFullSize,
                        canvasAbsoluteMode
                    ],
                    devices: {
                        default: [
                            { id: 'desktop', name: 'Desktop', width: '1200px' },
                            { id: 'tablet', name: 'Tablet', width: '768px' },
                            { id: 'mobile', name: 'Mobile', width: '375px' }
                        ]
                    },
                    project: {
                        default: {
                            pages: [
                                {
                                    name: 'Full Size + Absolute Demo',
                                    component: `
                                    <div style="position: relative; width: 100%; min-height: 800px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; overflow: hidden;">
                                        <!-- Header Section -->
                                        <div style="position: absolute; top: 50px; left: 50px; right: 50px; z-index: 10;">
                                            <h1 style="font-size: 3rem; font-weight: 800; margin: 0; text-align: center; text-shadow: 0 4px 8px rgba(0,0,0,0.3);">
                                                Full Size + Absolute Mode
                                            </h1>
                                            <p style="font-size: 1.2rem; text-align: center; margin: 20px 0; opacity: 0.9;">
                                                Design at full screen size with free drag-and-drop positioning
                                            </p>
                                        </div>

                                        <!-- Feature Cards -->
                                        <div style="position: absolute; top: 200px; left: 100px; width: 300px; height: 200px; background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: 16px; padding: 30px; border: 1px solid rgba(255,255,255,0.2);">
                                            <h3 style="margin: 0 0 15px 0; font-size: 1.5rem; font-weight: 600;">🖥️ Full Size Canvas</h3>
                                            <ul style="margin: 0; padding: 0; list-style: none; line-height: 1.8;">
                                                <li>• Independent of screen size</li>
                                                <li>• Perfect for large templates</li>
                                                <li>• Responsive device preview</li>
                                                <li>• Smooth transitions</li>
                                            </ul>
                                        </div>

                                        <div style="position: absolute; top: 200px; right: 100px; width: 300px; height: 200px; background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: 16px; padding: 30px; border: 1px solid rgba(255,255,255,0.2);">
                                            <h3 style="margin: 0 0 15px 0; font-size: 1.5rem; font-weight: 600;">🎯 Absolute Positioning</h3>
                                            <ul style="margin: 0; padding: 0; list-style: none; line-height: 1.8;">
                                                <li>• Free drag & drop</li>
                                                <li>• Pixel-perfect placement</li>
                                                <li>• No layout constraints</li>
                                                <li>• Direct positioning</li>
                                            </ul>
                                        </div>

                                        <!-- Interactive Elements -->
                                        <div style="position: absolute; top: 450px; left: 200px; width: 120px; height: 120px; background: linear-gradient(45deg, #ff6b6b, #ee5a24); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 3rem; box-shadow: 0 10px 30px rgba(238, 90, 36, 0.4); cursor: move;">
                                            🚀
                                        </div>

                                        <div style="position: absolute; top: 500px; left: 400px; width: 80px; height: 80px; background: linear-gradient(45deg, #4ecdc4, #44a08d); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 2rem; box-shadow: 0 8px 25px rgba(68, 160, 141, 0.4); cursor: move;">
                                            ⭐
                                        </div>

                                        <div style="position: absolute; top: 420px; right: 200px; width: 100px; height: 100px; background: linear-gradient(45deg, #feca57, #ff9ff3); border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; box-shadow: 0 8px 25px rgba(254, 202, 87, 0.4); cursor: move;">
                                            💎
                                        </div>

                                        <!-- Instructions -->
                                        <div style="position: absolute; bottom: 80px; left: 50px; right: 50px; text-align: center; background: rgba(0,0,0,0.2); padding: 20px; border-radius: 12px; backdrop-filter: blur(5px);">
                                            <h4 style="margin: 0 0 10px 0; font-size: 1.2rem;">How to Use:</h4>
                                            <p style="margin: 0; font-size: 0.95rem; opacity: 0.9;">
                                                • Drag any element to move it freely • Switch between device sizes to see full-size canvas in action • 
                                                Canvas maintains full size regardless of your screen • Perfect for designing large layouts
                                            </p>
                                        </div>

                                        <!-- Decorative Elements -->
                                        <div style="position: absolute; top: 0; right: 0; width: 200px; height: 200px; background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%); border-radius: 50%;"></div>
                                        <div style="position: absolute; bottom: 0; left: 0; width: 150px; height: 150px; background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%); border-radius: 50%;"></div>
                                    </div>

                                    <style>
                                        body {
                                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                                            margin: 0;
                                            background: #f8f9fa;
                                        }
                                        
                                        /* Custom cursor for draggable elements */
                                        [style*="cursor: move"]:hover {
                                            transform: scale(1.05);
                                            transition: transform 0.2s ease;
                                        }
                                        
                                        /* Smooth transitions for all positioned elements */
                                        [style*="position: absolute"] {
                                            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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

