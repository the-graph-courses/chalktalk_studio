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

When creating or replacing slides, generate COMPLETE slide documents using this format:

<h1 class="slide-title">Your Title Here</h1>
<p class="slide-subtitle">Your subtitle or content here</p>
<style>
    body {
        width: 1280px;
        height: 720px;
        background-color: #ffffff; /* Choose appropriate background */
    }
    .slide-title {
        position: absolute;
        top: 260px;
        left: 100px;
        font-size: 72px;
        margin: 0;
        font-weight: 700;
        color: #2c3e50; /* Choose appropriate color */
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    .slide-subtitle {
        position: absolute;
        top: 360px;
        left: 100px;
        font-size: 32px;
        max-width: 1080px;
        line-height: 1.5;
        color: #555;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        font-weight: 300;
        margin: 0;
    }
</style>

IMPORTANT RULES:
- Always include a <style> tag with body dimensions
- Use unique CSS class names for each slide (e.g., .marketing-slide, .tech-slide, etc.)
- The system will automatically enforce width: 1280px and height: 720px
- Make slides visually appealing with appropriate colors, fonts, and layouts
- Use absolute positioning for precise element placement
- Choose appropriate background colors and typography for the content theme

Focus on creating beautiful, professional slide designs. Be helpful, concise, and focused on presentation and design-related tasks.`,

        // Stop after a maximum of 5 steps if tools were called
        stopWhen: stepCountIs(5),
    });

    return result.toUIMessageStreamResponse();
}

