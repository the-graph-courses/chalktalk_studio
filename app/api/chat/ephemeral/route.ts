import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText, convertToModelMessages, type UIMessage, tool, stepCountIs } from 'ai';
import { createSlideTools } from '@/lib/slide-tools';
import { auth } from '@clerk/nextjs/server';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const { userId } = await auth();
    if (!userId) {
        return new Response('Unauthorized', { status: 401 });
    }
    const { messages, projectId, preferences }: {
        messages: UIMessage[];
        projectId: string;
        preferences?: { preferAbsolutePositioning?: boolean };
    } = await req.json();

    const tools = createSlideTools(projectId, userId, preferences);

    const openrouter = createOpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY,
    });

    const result = streamText({
        model: openrouter.chat('anthropic/claude-3-5-sonnet-20241022'),
        messages: convertToModelMessages(messages),
        ...(tools && { tools }),
        system: `You are an AI assistant for ChalkTalk Studio, a presentation creation platform. You can help users with:

1. Creating and editing slide presentations
2. Understanding design principles for presentations  
3. Analyzing images and PDFs they upload
4. Providing feedback on presentation content
5. Suggesting improvements for slides

You have access to tools to interact with slide presentations:
- readDeck: Read all slides in the current presentation (returns clean HTML content as plain text)
- readSlide: Read a specific slide by index (returns clean HTML content as plain text)
- createSlide: Create a new slide with HTML content (provide clean HTML as plain text)
- replaceSlide: Replace content of an existing slide (provide clean HTML as plain text)

When reading slides, you'll receive clean HTML content as plain text without JSON escaping.

When creating or replacing slides, generate COMPLETE slides wrapped in a div with id "slide-container".

IMPORTANT RULES:
- Always use embedded <style> tags, never inline styles
- Make slides visually appealing with appropriate colors, fonts, and layouts
- Choose appropriate background colors and typography for the content theme

Focus on creating beautiful, professional slide designs. Be helpful, concise, and focused on presentation and design-related tasks.`,

        // Stop after a maximum of 5 steps if tools were called
        stopWhen: stepCountIs(5),
    });

    return result.toUIMessageStreamResponse();
}
