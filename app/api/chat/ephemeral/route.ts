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

CRITICAL TOOL USAGE RULES:
- When users ask you to create or modify slides, you MUST use the appropriate tool functions
- NEVER output JSON or code snippets in your text response - only use tool calls
- Always provide clean HTML content in the tool's 'content' parameter
- Respond with natural language explaining what you're doing, then make the tool call

Available tools:
- readDeck: Read all slides in the current presentation
- readSlide: Read a specific slide by index  
- createSlide: Create a new slide with HTML content
- replaceSlide: Replace content of an existing slide

HTML CONTENT REQUIREMENTS:
- Provide clean HTML only (no <html>, <head>, or <body> wrappers)
- ALWAYS include a <style> tag at the beginning with comprehensive CSS styling
- Position elements absolutely on a 1280x720px canvas
- Use proper CSS syntax with semicolons and spacing
- Add class="fragment" to elements for Reveal.js animations
- Keep nesting minimal for GrapesJS editor compatibility
- Make slides visually appealing with proper typography, colors, and spacing

STYLING REQUIREMENTS:
- Include beautiful typography (font families, sizes, weights)
- Use attractive color schemes and backgrounds
- Add proper spacing, margins, and padding
- Consider visual hierarchy with different font sizes
- Use gradients, shadows, or other visual effects when appropriate
- Ensure good contrast for readability

CORRECT WORKFLOW:
1. User asks for slide creation/modification
2. You respond: "I'll create a slide about [topic]" (natural language)
3. You make the appropriate tool call with proper HTML content including <style> tag
4. You confirm what was created/modified

EXAMPLE HTML CONTENT WITH STYLING:
<style>
  .slide-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); width: 1280px; height: 720px; position: relative; }
  .main-title { font-family: 'Arial', sans-serif; font-size: 48px; font-weight: bold; color: white; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
  .content-list { font-family: 'Arial', sans-serif; font-size: 24px; color: white; line-height: 1.6; }
  .content-list li { margin-bottom: 12px; padding-left: 20px; }
  .highlight-box { background: rgba(255,255,255,0.1); border-radius: 10px; padding: 20px; backdrop-filter: blur(10px); }
</style>
<div class="slide-bg">
  <div style="position: absolute; left: 80px; top: 100px;">
    <h1 class="main-title fragment">Compelling Title</h1>
    <div class="highlight-box" style="margin-top: 40px; max-width: 800px;">
      <ul class="content-list">
        <li class="fragment">First key point with impact</li>
        <li class="fragment">Second important insight</li>
        <li class="fragment">Third compelling argument</li>
      </ul>
    </div>
  </div>
</div>

`,

        // Stop after a maximum of 5 steps if tools were called
        stopWhen: stepCountIs(25),
    });

    return result.toUIMessageStreamResponse();
}
