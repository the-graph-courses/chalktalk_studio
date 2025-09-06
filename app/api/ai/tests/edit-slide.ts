export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            projectId = 'project_pezn9p05voi_1757116077136',
            slideIndex = 0,
            newName = 'AI Edited Slide',
            newContent = '<div style="padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;"><h1 style="font-size: 56px; margin-bottom: 20px; text-align: center;">✏️ Edited by AI</h1><p style="font-size: 28px; text-align: center; opacity: 0.9; margin-bottom: 30px;">This slide content was modified by the AI tools test suite</p><div style="display: flex; gap: 20px; justify-content: center;"><div style="padding: 15px 25px; background: rgba(255,255,255,0.2); border-radius: 20px; backdrop-filter: blur(10px);"><span style="font-size: 16px;">🔧 Modified</span></div><div style="padding: 15px 25px; background: rgba(255,255,255,0.2); border-radius: 20px; backdrop-filter: blur(10px);"><span style="font-size: 16px;">✅ Updated</span></div></div></div>'
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
