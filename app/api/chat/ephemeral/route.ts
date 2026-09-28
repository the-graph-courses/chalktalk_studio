import { createCerebras } from '@ai-sdk/cerebras';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText, convertToModelMessages, type UIMessage, tool, stepCountIs, consumeStream } from 'ai';
import { createSlideTools } from '@/lib/slide-tools';
import { getDeckOutline } from '@/lib/slide-tools-server';
import { buildSystemPrompt, normalizePreferences } from '@/lib/slide-design';
import { auth } from '@clerk/nextjs/server';

// Building a whole deck takes many tool steps; allow long-running streams
export const maxDuration = 300;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }
  const { messages, projectId, preferences: rawPreferences, model = 'cerebras' }: {
    messages: UIMessage[];
    projectId: string;
    preferences?: unknown;
    model?: string;
  } = await req.json();

  const preferences = normalizePreferences(rawPreferences);
  const tools = createSlideTools(projectId, userId, preferences);

  // Give the model the deck's current shape so "fix slide 3" works without a read first
  let deckOutline: string | undefined;
  if (projectId) {
    try {
      deckOutline = await getDeckOutline(projectId, userId);
    } catch (e) {
      console.warn('Could not load deck outline:', e);
    }
  }
  const system = buildSystemPrompt(preferences, deckOutline);

  // Initialize providers
  const cerebras = createCerebras({
    apiKey: process.env.CEREBRAS_CODE_KEY,
  });

  const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  // Select model based on request
  let selectedModel;
  switch (model) {
    case 'claude-sonnet-4':
      selectedModel = openrouter('anthropic/claude-sonnet-4');
      break;
    case 'gpt-4o':
      selectedModel = openrouter('openai/gpt-4o');
      break;
    case 'cerebras':
    default:
      selectedModel = cerebras('qwen-3.8-27b');
      break;
  }

  const result = streamText({
    model: selectedModel,
    messages: convertToModelMessages(messages, { tools, ignoreIncompleteToolCalls: true }),
    ...(tools && { tools }),
    abortSignal: req.signal,
    system,

    // Enough steps for a full deck plus fixes
    stopWhen: stepCountIs(50),
  });

  return result.toUIMessageStreamResponse({
    onFinish: async ({ isAborted }) => {
      if (isAborted) {
        console.log('Stream was aborted by user');
      }
    },
    consumeSseStream: consumeStream,
  });
}
