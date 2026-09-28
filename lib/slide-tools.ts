import { tool } from 'ai';
import { z } from 'zod';
import { executeSlideToolServer } from './slide-tools-server';
import { lintSlideHtml } from './slide-lint';
import { DEFAULT_PREFERENCES, type GenerationPreferences } from './slide-design';

/**
 * Slide deck tools for AI chat interfaces
 * These tools interact with the current slide deck in the editor
 */

const forceSchema = z.boolean().optional().describe(
    'Apply the slide even if the checks report issues. Only set this when the user explicitly asked for what the checks flag (e.g. a dense slide, an unscoped style).'
);

const contentSchema = z.string().min(10).describe(
    'HTML for the slide body: normally a single <div class="ct ..."> layout root, optionally followed by a scoped <style>. No <html>/<body> and no slide container.'
);

type WriteResult = {
    success: boolean;
    command?: string;
    data?: Record<string, any>;
    message?: string;
    issues?: string[];
    warnings?: string[];
    error?: string;
};

// What the model sees for write tools: status and feedback, without the slide HTML echoed back
// (the full output, including the editor command, still goes to the chat UI)
const writeResultForModel = (output: WriteResult) => {
    const value: Record<string, string | boolean | string[]> = { success: output.success };
    if (output.message) value.message = output.message;
    if (output.error) value.error = output.error;
    if (output.issues?.length) value.issues = output.issues;
    if (output.warnings?.length) value.warnings = output.warnings;
    return { type: 'json' as const, value };
};

export function createSlideTools(projectId?: string, userId?: string, preferences: GenerationPreferences = DEFAULT_PREFERENCES) {
    // Both projectId and userId are required for authenticated tool calls
    if (!projectId || !userId) {
        return undefined;
    }

    const check = (content: string, force?: boolean): WriteResult | null => {
        const { issues, warnings } = lintSlideHtml(content, preferences);
        if (issues.length && !force) {
            return {
                success: false,
                message: 'Not applied. Fix the issues and call the tool again (or pass force: true if the user explicitly asked for this).',
                issues,
                warnings,
            };
        }
        return { success: true, warnings: [...issues.map(i => `(forced) ${i}`), ...warnings] };
    };

    return {
        readDeck: tool({
            description: 'Read every slide in the deck as HTML (plus any custom CSS each slide uses). Use this before deck-wide edits.',
            inputSchema: z.object({
                includeNames: z.boolean().default(true).describe('Whether to include slide names in the response'),
            }),
            execute: async ({ includeNames }) => {
                return await executeSlideToolServer('read_deck', { includeNames }, projectId, userId);
            },
        }),

        readSlide: tool({
            description: 'Read one slide by index (starting from 0) as HTML, plus any custom CSS it uses. Use this before editing a slide.',
            inputSchema: z.object({
                slideIndex: z.number().min(0).describe('The index of the slide to read (starting from 0)'),
            }),
            execute: async ({ slideIndex }) => {
                return await executeSlideToolServer('read_slide', { slideIndex }, projectId, userId);
            },
        }),

        createSlide: tool({
            description: 'Create one new slide from HTML. The slide is checked first; if the result has "issues" it was NOT created.',
            inputSchema: z.object({
                name: z.string().min(1).describe('Short slide name shown in the editor, e.g. "Pricing"').optional(),
                content: contentSchema,
                insertAtIndex: z.number().int().min(0).describe('Index to insert the slide at (0-based). Omit to append at the end.').optional(),
                force: forceSchema,
            }),
            execute: async ({ name, content, insertAtIndex, force }): Promise<WriteResult> => {
                const checked = check(content, force);
                if (!checked?.success) return checked!;
                try {
                    const slideData = { name, content, insertAtIndex };
                    const result = await executeSlideToolServer('create_slide', { slideData }, projectId, userId);

                    // The result contains a `command` field that the client executes in the editor
                    return {
                        ...result,
                        message: insertAtIndex === undefined ? 'Slide created at the end of the deck.' : `Slide created at index ${insertAtIndex}.`,
                        warnings: checked.warnings,
                    };
                } catch (error) {
                    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
                }
            },
            toModelOutput: (output) => writeResultForModel(output),
        }),

        replaceSlide: tool({
            description: 'Replace the whole content of an existing slide with new HTML. Read the slide first and keep what you were not asked to change. If the result has "issues" the slide was NOT changed.',
            inputSchema: z.object({
                slideIndex: z.number().min(0).describe('The index of the slide to replace (starting from 0)'),
                content: contentSchema,
                name: z.string().min(1).optional(),
                force: forceSchema,
            }),
            execute: async ({ slideIndex, content, name, force }): Promise<WriteResult> => {
                const checked = check(content, force);
                if (!checked?.success) return checked!;
                try {
                    const slideData = { content, name };
                    const result = await executeSlideToolServer('replace_slide', { slideIndex, slideData }, projectId, userId);

                    return {
                        ...result,
                        message: `Slide ${slideIndex} replaced.`,
                        warnings: checked.warnings,
                    };
                } catch (error) {
                    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
                }
            },
            toModelOutput: (output) => writeResultForModel(output),
        }),

        deleteSlide: tool({
            description: 'Delete a slide by its index (starting from 0). Ask the user to confirm before calling this.',
            inputSchema: z.object({
                slideIndex: z.number().min(0).describe('The index of the slide to delete (starting from 0)'),
            }),
            execute: async ({ slideIndex }) => {
                try {
                    const result = await executeSlideToolServer('delete_slide', { slideIndex }, projectId, userId);

                    return {
                        ...result,
                        message: 'Slide deleted successfully. The editor will now remove it.'
                    };
                } catch (error) {
                    return { error: error instanceof Error ? error.message : 'Unknown error' };
                }
            },
        }),
    };
}
