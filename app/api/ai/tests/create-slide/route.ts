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
      name = 'AI Created Slide',
      content = getSlideContainer(`
        <h2 style="position: absolute; top: 50px; left: 50px; font-size: 48px; font-weight: 700; color: white;">AI Created Slide</h2>
        <p style="position: absolute; top: 130px; left: 50px; font-size: 22px; max-width: 550px; line-height: 1.5; color: white;">This slide was created with rich content directly by the AI, demonstrating the ability to generate complete slides in one step.</p>
      `, undefined, {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
      }),
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
