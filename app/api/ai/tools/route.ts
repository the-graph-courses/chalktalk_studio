// This endpoint is still needed for the client-side AI chat tools
import { auth } from '@clerk/nextjs/server';
import { executeSlideToolServer } from '@/lib/slide-tools-server';

export async function POST(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { toolName, parameters, projectId } = await request.json();

        const result = await executeSlideToolServer(
            toolName,
            parameters,
            projectId,
            userId
        );

        return Response.json(result);
    } catch (error) {
        console.error('Tool execution error:', error);
        return Response.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
