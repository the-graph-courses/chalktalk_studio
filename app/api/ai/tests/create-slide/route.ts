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
      name = 'Empty Slide',
      content = '',
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
