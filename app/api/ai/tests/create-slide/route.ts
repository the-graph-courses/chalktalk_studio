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
      name = 'AI Created Slide',
      content = `
        <!-- Slide container that exactly matches body dimensions -->
        <div id="slide-container" style="position: absolute; top: 0; left: 0; width: 1920px; height: 1080px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; overflow: visible;">
          <h1 style="position: absolute; top: 300px; left: 150px; font-size: 72px; font-weight: 700; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">AI Created Slide</h1>
          
          <p style="position: absolute; top: 420px; left: 150px; font-size: 33px; max-width: 1400px; line-height: 1.5; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);">This slide was created with rich content directly by the AI, demonstrating the ability to generate complete slides in one step.</p>
          
          <div style="position: absolute; bottom: 200px; left: 150px; padding: 20px 35px; background: rgba(255,255,255,0.2); border-radius: 12px; backdrop-filter: blur(10px);">
            <span style="font-size: 24px; font-weight: 600;">✨ Created with content!</span>
          </div>
          
          <!-- Page Number -->
          <div style="position: absolute; bottom: 50px; left: 50px; padding: 12px 18px; background: rgba(0,0,0,0.6); color: white; border-radius: 8px; font-size: 20px; font-weight: 500; box-shadow: 0 2px 8px rgba(0,0,0,0.3); backdrop-filter: blur(5px);">
            <span>1</span>
          </div>
          
          <div class="gjs-icon" style="position: absolute; bottom: 200px; right: 150px; width: 120px; height: 120px; opacity: 0.7;">
            <svg style="width: 100%; height: 100%;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
            </svg>
          </div>
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
        </style>
      `,
      insertAtIndex
    } = body as any;

    const result = await executeSlideToolServer(
      'create_slide',
      { slideData: { name, content, insertAtIndex } },
      projectId,
      userId
    );

    return Response.json({
      test: 'create_slide',
      projectId,
      slideName: name,
      insertAtIndex,
      success: result.success,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Create slide test error:', error);
    return Response.json({
      test: 'create_slide',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
