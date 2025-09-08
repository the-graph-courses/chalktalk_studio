import { getAIModel } from '@/lib/ai';
import { generateText } from 'ai';

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
      message = 'Hello! Please respond with a brief confirmation that you can help with slide generation.'
    } = body;

    // Use direct AI model instead of the chat endpoint to avoid auth issues
    const model = getAIModel('anthropic');

    const result = await generateText({
      model,
      prompt: message,
      maxTokens: 100,
    });

    return Response.json({
      test: 'chat',
      message,
      success: true,
      result: {
        success: true,
        fullResponse: result.text,
        usage: result.usage,
        provider: 'anthropic'
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Chat test error:', error);
    return Response.json({
      test: 'chat',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      result: {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}
