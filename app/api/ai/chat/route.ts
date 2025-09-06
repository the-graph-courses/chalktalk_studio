import { getAIModel } from '@/lib/ai';
import { aiTools } from '@/lib/ai/tools';
import { streamText } from 'ai';
import { api } from '@/convex/_generated/api';
import { fetchQuery } from 'convex/nextjs';

const SYSTEM_PROMPT = `You are ChalkTalk's AI assistant for slide presentation creation and editing.

You can help users by:
1. Reading specific slides or entire slide decks
2. Generating new slides with engaging content
3. Editing existing slides based on user requests

When generating slides, create HTML that works well with GrapesJS absolute positioning:
- Use proper semantic HTML structure
- Include inline styles for positioning and appearance
- Target 1600x900px slide dimensions
- Make text readable and appropriately sized for presentations

Always be helpful and clear about what actions you're taking.`;

export async function POST(request: Request) {
    try {
        const { messages, projectId } = await request.json();

        if (!projectId) {
            return Response.json({ error: 'Project ID is required' }, { status: 400 });
        }

        // Get current project data from Convex
        const project = await fetchQuery(api.slideDeck.GetProject, { projectId });

        if (!project) {
            return Response.json({ error: 'Project not found' }, { status: 404 });
        }

        const model = getAIModel();

        const result = await streamText({
            model,
            system: SYSTEM_PROMPT,
            messages,
            tools: aiTools,
            toolChoice: 'auto',
            maxTokens: 1000,
            onFinish: async ({ response }) => {
                // Log the interaction for debugging
                console.log('AI Chat completed:', {
                    projectId,
                    messageCount: messages.length,
                    toolCalls: response.toolCalls?.length || 0,
                });
            },
        });

        return result.toTextStreamResponse();
    } catch (error) {
        console.error('AI chat error:', error);
        return Response.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
