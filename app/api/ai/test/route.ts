import { getAIModel } from '@/lib/ai';
import { generateText } from 'ai';

export async function POST() {
    try {
        const model = getAIModel('anthropic');

        const result = await generateText({
            model,
            prompt: 'Say hello and confirm you can help with slide generation. Keep it brief.',
            maxTokens: 50,
        });

        return Response.json({
            test: 'ai_connection',
            success: true,
            message: result.text,
            usage: result.usage,
            provider: 'anthropic',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('AI connection test failed:', error);
        return Response.json({
            test: 'ai_connection',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
