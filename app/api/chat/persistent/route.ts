import { openai } from '@ai-sdk/openai';
import { streamText, convertToModelMessages, UIMessage } from 'ai';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export const maxDuration = 30;

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
    const { message, id: chatId, uid } = await req.json();

    // Load previous messages from Convex
    const previousMessages = await convex.query(api.chat.loadChat, { chatId, uid });

    // Append new message
    const messages: UIMessage[] = [...(previousMessages as UIMessage[]), message];

    const result = streamText({
        model: openai('gpt-4o'),
        messages: convertToModelMessages(messages),
        system: `You are an AI assistant for ChalkTalk Studio, a presentation creation platform. You can help users with:

1. Creating and editing slide presentations
2. Understanding design principles for presentations  
3. Analyzing images and PDFs they upload
4. Providing feedback on presentation content
5. Suggesting improvements for slides

Be helpful, concise, and focused on presentation and design-related tasks. When users upload images or PDFs, analyze them thoroughly and provide relevant insights.`
    });

    // Consume the stream to ensure it runs to completion for persistence
    result.consumeStream();

    return result.toUIMessageStreamResponse({
        originalMessages: messages,
        onFinish: async ({ messages }) => {
            // Save the updated messages to Convex
            await convex.mutation(api.chat.saveChat, {
                chatId,
                uid,
                messages,
            });
        },
    });
}
