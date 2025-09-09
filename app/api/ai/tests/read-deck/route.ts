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

    const { projectId = 'project_5ixc4na0jc4_1757422475707', includeNames = true } = body as any;

    const result = await executeSlideToolServer(
      'read_deck',
      { includeNames },
      projectId,
      userId
    );

    return Response.json({
      test: 'read_deck',
      projectId,
      includeNames,
      success: result.success,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Read deck test error:', error);
    return Response.json({
      test: 'read_deck',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
