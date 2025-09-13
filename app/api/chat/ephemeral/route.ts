import { createCerebras } from '@ai-sdk/cerebras';
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

    const cerebras = createCerebras({
        apiKey: process.env.CEREBRAS_CODE_KEY,
    });

    const result = streamText({
        model: cerebras('qwen-3-coder-480b'),
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

When creating or replacing slides, generate complete slides wrapped in a div with id "slide-container".

Slides will be edited in a grapesjs editor, so it is important to avoid nested elements, so that the user can edit one element without affecting others. All elements should be absolute positioned on a 1280x720px canvas. 

Each individual element should also have the class fragment, to enable reveal.js fragment animations.

The CSS for each slide is independent, and should be stored inline.

`,

        // Stop after a maximum of 5 steps if tools were called
        stopWhen: stepCountIs(25),
    });

    return result.toUIMessageStreamResponse();
}
