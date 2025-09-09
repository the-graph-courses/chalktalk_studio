import { tool } from 'ai';
import { z } from 'zod';
import { executeSlideToolServer } from './slide-tools-server';

/**
 * Slide deck tools for AI chat interfaces
 * These tools interact with the current slide deck in the editor
 */

export function createSlideTools(projectId?: string, userId?: string) {
    // Both projectId and userId are required for authenticated tool calls
    if (!projectId || !userId) {
        return undefined;
    }

    return {
        readDeck: tool({
            description: 'Read the entire slide deck with optional slide names. Use this to get an overview of all slides in the presentation.',
            inputSchema: z.object({
                includeNames: z.boolean().default(true).describe('Whether to include slide names in the response'),
            }),
            execute: async ({ includeNames }) => {
                try {
                    return await executeSlideToolServer('read_deck', { includeNames }, projectId, userId);
                } catch (error) {
                    return { error: error instanceof Error ? error.message : 'Unknown error' };
                }
            },
        }),

        readSlide: tool({
            description: 'Read a specific slide by its index (starting from 0). Use this to examine the content of a particular slide.',
            inputSchema: z.object({
                slideIndex: z.number().min(0).describe('The index of the slide to read (starting from 0)'),
            }),
            execute: async ({ slideIndex }) => {
                try {
                    return await executeSlideToolServer('read_slide', { slideIndex }, projectId, userId);
                } catch (error) {
                    return { error: error instanceof Error ? error.message : 'Unknown error' };
                }
            },
        }),

        createSlide: tool({
            description: 'Create a new slide with specified name and content. The content should be valid HTML with inline styles for positioning.',
            inputSchema: z.object({
                name: z.string().describe('The name/title for the new slide'),
                content: z.string().default('').describe('HTML content for the slide with inline styles. Use absolute positioning for layout control.'),
                insertAtIndex: z.number().optional().describe('Index to insert the slide at. Use -1 or omit to add at the end.'),
            }),
            execute: async ({ name, content, insertAtIndex }) => {
                try {
                    const result = await executeSlideToolServer('create_slide', { name, content, insertAtIndex }, projectId, userId);

                    // The result now contains a `command` field that the client can use.
                    // We simply pass it through.
                    return {
                        ...result,
                        message: 'Slide created successfully. The editor will now add it.'
                    };
                } catch (error) {
                    return { error: error instanceof Error ? error.message : 'Unknown error' };
                }
            },
        }),

        replaceSlide: tool({
            description: 'Replace the content and optionally the name of an existing slide. Use this to modify or update slide content.',
            inputSchema: z.object({
                slideIndex: z.number().min(0).describe('The index of the slide to replace (starting from 0)'),
                newContent: z.string().describe('New HTML content for the slide with inline styles. Use absolute positioning for layout control.'),
                newName: z.string().optional().describe('New name for the slide (optional)'),
            }),
            execute: async ({ slideIndex, newContent, newName }) => {
                try {
                    const result = await executeSlideToolServer('replace_slide', { slideIndex, newContent, newName }, projectId, userId);

                    return {
                        ...result,
                        message: 'Slide replaced successfully. The editor will now update it.'
                    };
                } catch (error) {
                    return { error: error instanceof Error ? error.message : 'Unknown error' };
                }
            },
        }),
    };
}
