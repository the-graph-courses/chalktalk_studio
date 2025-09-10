'use client'

import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';
import { canvasAbsoluteMode, canvasFullSize } from '@grapesjs/studio-sdk-plugins';

export default function FullSizeAbsoluteDemoPage() {
    // Slide Format Configurations - Comment/Uncomment to test different formats

    // 16:9 Aspect Ratio
    const slide_16_9_hd = { height: 720, width: 1280, name: '16:9 HD (1280x720)' };
    const slide_16_9_4k = { height: 2160, width: 3840, name: '16:9 4K (3840x2160)' };

    // 4:3 Aspect Ratio  
    const slide_4_3_standard = { height: 768, width: 1024, name: '4:3 Standard (1024x768)' };
    const slide_4_3_high = { height: 1536, width: 2048, name: '4:3 High (2048x1536)' };

    // 1:1 Square Aspect Ratio
    const slide_1_1_medium = { height: 1080, width: 1080, name: '1:1 Medium (1080x1080)' };
    const slide_1_1_large = { height: 2048, width: 2048, name: '1:1 Large (2048x2048)' };

    // portrait formats
    const slide_portrait_medium = { height: 1080, width: 720, name: 'Portrait Medium (720x1080)' };
    const slide_portrait_large = { height: 2048, width: 1365, name: 'Portrait Large (1365x2048)' };

    // ACTIVE SLIDE FORMAT - Change this line to test different formats
    const activeSlide = slide_16_9_hd;
    // const activeSlide = slide_16_9_4k;
    // const activeSlide = slide_4_3_standard;
    // const activeSlide = slide_4_3_high;
    // const activeSlide = slide_1_1_medium;
    // const activeSlide = slide_1_1_large;
    // const activeSlide = slide_portrait_medium;
    // const activeSlide = slide_portrait_large;


    return (
        <div className="h-screen w-full">
            <StudioEditor
                options={{
                    licenseKey: process.env.NEXT_PUBLIC_GRAPES_SDK_LICENSE_KEY || '',
                    plugins: [
                        canvasFullSize.init({
                            deviceMaxWidth: activeSlide.width,  // Body width = slide width
                        }),
                        canvasAbsoluteMode
                    ],
                    project: {
                        default: {
                            pages: [
                                {
                                    name: activeSlide.name,
                                    component: `
                                    <!-- Direct content on body as slide -->
                                    <p style="position: absolute; left: 100px; top: 100px; color: white; font-size: 24px;">${activeSlide.name}</p>
                                    <!-- Corners -->
                                    <span style="position:absolute;top:10px;left:10px">•</span>
                                    <span style="position:absolute;bottom:10px;right:10px">•</span>
                                    
                                    <style>
                                        body {
                                            width: ${activeSlide.width}px;
                                            height: ${activeSlide.height}px;
                                            background: linear-gradient(135deg, #3b82f6 0%, #3453ba 100%);
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
