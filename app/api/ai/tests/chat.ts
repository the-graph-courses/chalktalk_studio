export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            projectId = 'project_pezn9p05voi_1757116077136',
            message = 'Can you read my slide deck and tell me what slides I have?'
        } = body;

        const response = await fetch(`${process.env.NEXTJS_URL || 'http://localhost:3000'}/api/ai/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [{ role: 'user', content: message }],
                projectId,
            }),
        });

        // For streaming responses, we'll just check if it starts successfully
        const isSuccess = response.ok;
        let result = null;

        if (isSuccess) {
            try {
                // Try to read the first chunk of the stream
                const reader = response.body?.getReader();
                if (reader) {
                    const { value } = await reader.read();
                    const chunk = new TextDecoder().decode(value);
                    result = { streamStarted: true, firstChunk: chunk.slice(0, 200) + '...' };
                    reader.releaseLock();
                }
            } catch (streamError) {
                result = { streamStarted: true, note: 'Stream started but could not read chunk' };
            }
        } else {
            result = await response.json();
        }

        return Response.json({
            test: 'chat',
            projectId,
            message,
            success: isSuccess,
            result,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Chat test error:', error);
        return Response.json({
            test: 'chat',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
