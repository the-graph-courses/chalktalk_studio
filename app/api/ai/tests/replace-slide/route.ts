import { auth } from '@clerk/nextjs/server';
import { executeSlideToolServer } from '@/lib/slide-tools-server';

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
            newContent = `
              <h1 style="position:absolute; top:50px; left:50px; font-size:48px; font-weight:700;">AI Replaced Slide</h1>

              <p style="position:absolute; top:130px; left:50px; font-size:22px; max-width:550px; line-height:1.5;">The content of this slide has been replaced using absolute positioning for optimal layout control.</p>

              <!-- Page Number -->
              <div style="position:absolute; bottom:15px; left:15px; padding:8px 12px; background:rgba(0,0,0,0.6); color:white; border-radius:6px; font-size:14px; font-weight:500; box-shadow:0 2px 8px rgba(0,0,0,0.3); backdrop-filter:blur(5px);">
                <span>1</span>
              </div>

              <div class="gjs-icon" style="position:absolute; bottom:50px; right:50px; width:80px; height:80px; transform: rotate(15deg);">
                <svg style="width:100%; height:100%;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </div>

              <style>
                body {
                  width: 800px;
                  height: 500px;
                  margin: 0;
                  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%);
                  color: #333;
                  border-radius: 12px;
                  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                  overflow: hidden;
                }
              </style>
            `
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
