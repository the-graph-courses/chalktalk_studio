'use client'

import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';
import { canvasAbsoluteMode } from '@grapesjs/studio-sdk-plugins';

export default function ViewportBasedDesignPage() {
    return (
        <div className="h-screen w-full">
            <StudioEditor
                options={{
                    licenseKey: process.env.NEXT_PUBLIC_GRAPES_SDK_LICENSE_KEY || '',
                    plugins: [canvasAbsoluteMode],
                    project: {
                        default: {
                            pages: [
                                {
                                    name: 'Presentation',
                                    component: `
                                    <div class="slide">
                                        <div class="slide-title">Absolute Mode</div>
                                        <p class="slide-text">
                                            Enable free positioning for your elements — perfect for fixed layouts like presentations, business cards, or print-ready designs.
                                        </p>
                                        <ul class="slide-list">
                                            <li>🎯 Drag & place elements anywhere</li>
                                            <li>🧲 Smart snapping & axis locking</li>
                                            <li>⚙️ You custom logic</li>
                                        </ul>
                                        <div class="deco-shape-1"></div>
                                        <div class="deco-shape-2">📐</div>
                                        <div class="footer-text">Studio SDK · GrapesJS</div>
                                    </div>
                                    <style>
                                        body {
                                            font-family: system-ui;
                                            background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
                                        }
                                        .slide {
                                            width: min(800px, 90vw);
                                            height: min(500px, 56.25vw);
                                            position: relative;
                                            margin: 5vh auto;
                                            background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
                                            color: #1a1a1a;
                                            border-radius: 12px;
                                            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                                            overflow: hidden;
                                        }
                                        .deco-shape-1 {
                                            position: absolute;
                                            top: 0;
                                            right: -5%;
                                            width: 40%;
                                            height: 100%;
                                            background-color: #baccec;
                                            transform: skewX(-12deg)
                                        }
                                        .slide-title {
                                            position: absolute;
                                            top: 8%;
                                            left: 5%;
                                            font-size: clamp(2rem, 5vw, 3.125rem);
                                            margin: 0;
                                            font-weight: 700;
                                        }
                                        .slide-text {
                                            position: absolute;
                                            top: 27%;
                                            left: 5%;
                                            font-size: clamp(1rem, 2.5vw, 1.375rem);
                                            max-width: 55%;
                                            line-height: 1.5;
                                            color: #333;
                                        }
                                        .slide-list {
                                            position: absolute;
                                            top: 58%;
                                            left: 5%;
                                            font-size: clamp(0.9rem, 2vw, 1.125rem);
                                            line-height: 2;
                                            list-style: none;
                                            padding: 0;
                                        }
                                        .deco-shape-2 {
                                            position: absolute;
                                            right: 8%;
                                            top: 20%;
                                            width: 25%;
                                            height: 40%;
                                            background: rgba(255, 255, 255, 0.3);
                                            border-radius: 20px;
                                            backdrop-filter: blur(10px);
                                            box-shadow: 0 8px 24px rgba(0,0,0,0.1);
                                            display: flex;
                                            align-items: center;
                                            justify-content: center;
                                            font-size: clamp(3rem, 10vw, 5rem);
                                        }
                                        .footer-text {
                                            position: absolute;
                                            bottom: 5%;
                                            right: 10%;
                                            font-size: clamp(0.7rem, 1.5vw, 0.875rem);
                                            color: #555;
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

