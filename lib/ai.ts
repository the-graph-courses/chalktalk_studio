import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';

export function getAIModel(provider: 'anthropic' | 'openai' = 'anthropic') {
    switch (provider) {
        case 'anthropic':
            if (!process.env.ANTHROPIC_API_KEY) {
                throw new Error('ANTHROPIC_API_KEY is required');
            }
            return anthropic('claude-3-5-sonnet-20241022');
        case 'openai':
            if (!process.env.OPENAI_API_KEY) {
                throw new Error('OPENAI_API_KEY is required');
            }
            return openai('gpt-4o');
        default:
            throw new Error(`Unsupported provider: ${provider}`);
    }
}
