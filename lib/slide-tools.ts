import { tool } from 'ai';
import { z } from 'zod';

/**
 * Slide deck tools for AI chat interfaces
 * These tools interact with the current slide deck in the editor
 */

export function createSlideTools(projectId?: string) {
    if (!projectId) {
        // Return undefined if no project ID to indicate no tools available
        return undefined;
    }

    return {
        readDeck: tool({
            description: 'Read the entire slide deck with optional slide names. Use this to get an overview of all slides in the presentation.',
            inputSchema: z.object({
                includeNames: z.boolean().default(true).describe('Whether to include slide names in the response'),
            }),
            execute: async ({ includeNames }) => {
                const response = await fetch(`${process.env.NEXTJS_URL || 'http://localhost:3000'}/api/ai/tools`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        toolName: 'read_deck',
                        parameters: { includeNames },
                        projectId,
                    }),
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(`Failed to read deck: ${error.error || 'Unknown error'}`);
                }

                const result = await response.json();
                if (!result.success) {
                    throw new Error(`Failed to read deck: ${result.error || 'Unknown error'}`);
                }

                return result.data;
            },
        }),

        readSlide: tool({
            description: 'Read a specific slide by its index (starting from 0). Use this to examine the content of a particular slide.',
            inputSchema: z.object({
                slideIndex: z.number().min(0).describe('The index of the slide to read (starting from 0)'),
            }),
            execute: async ({ slideIndex }) => {
                const response = await fetch(`${process.env.NEXTJS_URL || 'http://localhost:3000'}/api/ai/tools`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        toolName: 'read_slide',
                        parameters: { slideIndex },
                        projectId,
                    }),
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(`Failed to read slide: ${error.error || 'Unknown error'}`);
                }

                const result = await response.json();
                if (!result.success) {
                    throw new Error(`Failed to read slide: ${result.error || 'Unknown error'}`);
                }

                return result.data;
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
                const response = await fetch(`${process.env.NEXTJS_URL || 'http://localhost:3000'}/api/ai/tools`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        toolName: 'create_slide',
                        parameters: { name, content, insertAtIndex },
                        projectId,
                    }),
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(`Failed to create slide: ${error.error || 'Unknown error'}`);
                }

                const result = await response.json();
                if (!result.success) {
                    throw new Error(`Failed to create slide: ${result.error || 'Unknown error'}`);
                }

                // Execute the editor command if available
                if (typeof window !== 'undefined' && window.grapesjsAITools && result.command === 'addSlide') {
                    const { name, content, insertAtIndex } = result.data;
                    const executed = window.grapesjsAITools.addSlide(name, content, insertAtIndex);
                    return {
                        ...result.data,
                        executed,
                        message: executed ? 'Slide created and added to the editor' : 'Slide created but could not be added to the editor'
                    };
                }

                return {
                    ...result.data,
                    message: 'Slide created successfully'
                };
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
                const response = await fetch(`${process.env.NEXTJS_URL || 'http://localhost:3000'}/api/ai/tools`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        toolName: 'replace_slide',
                        parameters: { slideIndex, newContent, newName },
                        projectId,
                    }),
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(`Failed to replace slide: ${error.error || 'Unknown error'}`);
                }

                const result = await response.json();
                if (!result.success) {
                    throw new Error(`Failed to replace slide: ${result.error || 'Unknown error'}`);
                }

                // Execute the editor command if available
                if (typeof window !== 'undefined' && window.grapesjsAITools && result.command === 'replaceSlide') {
                    const { slideIndex, newContent, newName } = result.data;
                    const executed = window.grapesjsAITools.replaceSlide(slideIndex, newContent, newName);
                    return {
                        ...result.data,
                        executed,
                        message: executed ? 'Slide replaced and updated in the editor' : 'Slide replaced but could not be updated in the editor'
                    };
                }

                return {
                    ...result.data,
                    message: 'Slide replaced successfully'
                };
            },
        }),
    };
}
