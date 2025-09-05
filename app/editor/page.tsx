'use client'
import StudioEditor from '@grapesjs/studio-sdk/react';
import '@grapesjs/studio-sdk/style';
import { useUser } from '@clerk/nextjs';

export default function EditorPage() {
    const { user } = useUser();

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div style={{ height: '100vh', width: '100%' }}>
            <StudioEditor
                options={{
                    licenseKey: '5e881afcb7a44805a2019dd426c02e7b5cbe9657722247beac64c449f3527dcc',
                    project: {
                        type: 'web',
                        default: {
                            pages: [
                                { name: 'Slide 1', component: '<section style="position:relative;width:1600px;height:900px;margin:0 auto;background:#fff;"><h1>Welcome to your new slide deck!</h1></section>' },
                            ]
                        },
                    },
                    identity: {
                        id: user.id,
                    }
                }}
            />
        </div>
    );
}
