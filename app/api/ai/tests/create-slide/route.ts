export async function POST(request: Request) {
  try {
    let body = {};
    try {
      const text = await request.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch {
      // Ignore JSON parsing errors, use empty body
    }
    const {
      projectId = 'project_tfk2w50d5ki_1757347069126',
      name = 'Empty Slide',
      content = '',
      insertAtIndex
    } = body as any;

    const response = await fetch(`${process.env.NEXTJS_URL || 'http://localhost:3000'}/api/ai/tools`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toolName: 'create_slide',
        parameters: { name, content, insertAtIndex },
        projectId,
      }),
    });

    const result = await response.json();

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
