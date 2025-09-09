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
    const { projectId = 'project_tfk2w50d5ki_1757347069126', includeNames = true } = body as any;

    const response = await fetch(`${process.env.NEXTJS_URL || 'http://localhost:3000'}/api/ai/tools`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toolName: 'read_deck',
        parameters: { includeNames },
        projectId,
      }),
    });

    const result = await response.json();

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
