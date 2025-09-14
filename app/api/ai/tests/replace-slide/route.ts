import { auth } from '@clerk/nextjs/server';
import { executeSlideToolServer } from '@/lib/slide-tools-server';
import { getSlideContainer } from '@/lib/slide-formats';

export async function POST(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let body = {};
        try {
            const text = await request.text();
            if (text) body = JSON.parse(text);
        } catch { }

        const {
            projectId = 'project_5ixc4na0jc4_1757422475707',
            slideIndex = 0,
            newName = 'AI Replaced Slide',
            newContent = getSlideContainer(`
                <h2 style="position: absolute; top: 50px; left: 50px; font-size: 48px; font-weight: 700;">AI Replaced Slide</h2>
                <p style="position: absolute; top: 130px; left: 50px; font-size: 22px; max-width: 550px; line-height: 1.5;">The content of this slide has been replaced using absolute positioning for optimal layout control.</p>
            `, undefined, {
                background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
                color: '#333',
                borderRadius: '12px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
            })
        } = body as any;

        const result = await executeSlideToolServer(
            'replace_slide',
            { slideIndex, newContent, newName },
            projectId,
            userId
        );

        return Response.json({
            test: 'replace_slide',
            projectId,
            slideIndex,
            newName,
            success: result.success,
            result,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Replace slide test error:', error);
        return Response.json({
            test: 'replace_slide',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
