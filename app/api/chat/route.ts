import { openai } from '@ai-sdk/openai';
import { streamText, convertToModelMessages, type UIMessage, tool, stepCountIs } from 'ai';
import { createSlideTools } from '@/lib/slide-tools';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages, projectId }: { messages: UIMessage[]; projectId: string } = await req.json();

    const tools = createSlideTools(projectId);

    const result = streamText({
        model: openai('gpt-4o'),
        messages: convertToModelMessages(messages),
        ...(tools && { tools }),
        system: `You are an AI assistant for ChalkTalk Studio, a presentation creation platform. You can help users with:

1. Creating and editing slide presentations
2. Understanding design principles for presentations  
3. Analyzing images and PDFs they upload
4. Providing feedback on presentation content
5. Suggesting improvements for slides

You have access to tools to interact with slide presentations:
- readDeck: Read all slides in the current presentation
- readSlide: Read a specific slide by index
- createSlide: Create a new slide with HTML content
- replaceSlide: Replace content of an existing slide

When creating or replacing slide content, use HTML with inline styles and absolute positioning for layout control. Make the content visually appealing and professional.

Be helpful, concise, and focused on presentation and design-related tasks. When users upload images or PDFs, analyze them thoroughly and provide relevant insights.`,

        // Stop after a maximum of 5 steps if tools were called
        stopWhen: stepCountIs(5),
    });

    return result.toUIMessageStreamResponse();
}
