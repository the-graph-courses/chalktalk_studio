export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      projectId = 'project_pezn9p05voi_1757116077136',
      name = 'AI Test Slide',
      content = '<div style="padding: 40px; background: linear-gradient(45deg, #ff6b6b, #4ecdc4); color: white; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;"><h1 style="font-size: 48px; margin-bottom: 20px; text-align: center;">🤖 AI Generated Slide</h1><p style="font-size: 24px; text-align: center; opacity: 0.9;">This slide was created by the AI tools test suite</p><div style="margin-top: 30px; padding: 20px; background: rgba(255,255,255,0.2); border-radius: 10px;"><span style="font-size: 18px;">✨ Automatically generated content</span></div></div>',
      insertAtIndex
    } = body;

    const response = await fetch(`${process.env.NEXTJS_URL || 'http://localhost:3000'}/api/ai/tools`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toolName: 'generate_slide',
        parameters: { name, content, insertAtIndex },
        projectId,
      }),
    });

    const result = await response.json();

    return Response.json({
      test: 'generate_slide',
      projectId,
      slideName: name,
      insertAtIndex,
      success: result.success,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Generate slide test error:', error);
    return Response.json({
      test: 'generate_slide',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
