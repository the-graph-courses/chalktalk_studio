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
        <h1 style="position:absolute; top:50px; left:50px; font-size:48px; font-weight:700; text-shadow:2px 2px 4px rgba(0,0,0,0.3);">AI Created Slide</h1>

        <p style="position:absolute; top:130px; left:50px; font-size:22px; max-width:550px; line-height:1.5; text-shadow:1px 1px 2px rgba(0,0,0,0.3);">This slide was created with rich content directly by the AI, demonstrating the ability to generate complete slides in one step.</p>

        <div style="position:absolute; bottom:50px; left:50px; padding:15px 25px; background:rgba(255,255,255,0.2); border-radius:8px; backdrop-filter:blur(10px);">
          <span style="font-size:16px; font-weight:600;">✨ Created with content!</span>
        </div>

        <!-- Page Number -->
        <div style="position:absolute; bottom:15px; left:15px; padding:8px 12px; background:rgba(0,0,0,0.6); color:white; border-radius:6px; font-size:14px; font-weight:500; box-shadow:0 2px 8px rgba(0,0,0,0.3); backdrop-filter:blur(5px);">
          <span>1</span>
        </div>

        <div class="gjs-icon" style="position:absolute; bottom:50px; right:50px; width:80px; height:80px; opacity:0.7;">
          <svg style="width:100%; height:100%;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
          </svg>
        </div>

        <style>
          body {
            width: 800px;
            height: 500px;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
        </style>
      `,
      insertAtIndex
    } = body as any;

    const result = await executeSlideToolServer(
      'create_slide',
      { name, content, insertAtIndex },
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
