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
      projectId = 'project_xemtydcq0f_1757338119773',
      slideIndex = 0,
      newName = 'AI Edited Slide',
      newContent = `
        <div style="position: relative; width: 800px; height: 500px; margin: 70px auto 0; background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%); color: #333; border-radius: 12px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <h1 style="position: absolute; top: 50px; left: 50px; font-size: 48px; font-weight: 700;">AI Edited Slide</h1>
          
          <p style="position: absolute; top: 130px; left: 50px; font-size: 22px; max-width: 550px; line-height: 1.5;">The content of this slide has been replaced using absolute positioning for optimal layout control.</p>
          
          <div class="gjs-icon" style="position: absolute; bottom: 50px; right: 50px; width: 80px; height: 80px; transform: rotate(15deg);">
            <svg style="width: 100%; height: 100%;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </div>
        </div>
        

      `
    } = body;

    const response = await fetch(`${process.env.NEXTJS_URL || 'http://localhost:3000'}/api/ai/tools`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toolName: 'edit_slide',
        parameters: { slideIndex, newContent, newName },
        projectId,
      }),
    });

    const result = await response.json();

    return Response.json({
      test: 'edit_slide',
      projectId,
      slideIndex,
      newName,
      success: result.success,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Edit slide test error:', error);
    return Response.json({
      test: 'edit_slide',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
