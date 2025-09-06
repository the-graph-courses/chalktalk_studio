export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { projectId = 'project_pezn9p05voi_1757116077136', slideIndex = 0 } = body;

        const response = await fetch(`${process.env.NEXTJS_URL || 'http://localhost:3000'}/api/ai/tools`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                toolName: 'read_slide',
                parameters: { slideIndex },
                projectId,
            }),
        });

        const result = await response.json();

        return Response.json({
            test: 'read_slide',
            projectId,
            slideIndex,
            success: result.success,
            result,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Read slide test error:', error);
        return Response.json({
            test: 'read_slide',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
