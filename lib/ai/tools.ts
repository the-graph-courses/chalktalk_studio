import { tool } from 'ai';
import { z } from 'zod';

export const readSlideSchema = z.object({
    slideIndex: z.number().describe('Index of the slide to read (0-based)'),
});

export const readDeckSchema = z.object({
    includeNames: z.boolean().default(true).describe('Whether to include slide names'),
});

export const createSlideSchema = z.object({
    name: z.string().describe('Name/title for the new slide'),
    content: z.string().optional().describe('Optional HTML content for the slide (if not provided, creates empty slide)'),
    insertAtIndex: z.number().optional().describe('Index to insert at (default: append)'),
});

export const editSlideSchema = z.object({
    slideIndex: z.number().describe('Index of the slide to edit (0-based)'),
    newContent: z.string().describe('New HTML content for the slide'),
    newName: z.string().optional().describe('New name for the slide (optional)'),
});

export const readSlideTool = tool({
    description: 'Read the content of a specific slide by index',
    parameters: readSlideSchema,
});

export const readDeckTool = tool({
    description: 'Read the content of all slides in the deck',
    parameters: readDeckSchema,
});

export const createSlideTool = tool({
    description: 'Create a new slide (optionally with content, otherwise creates empty slide)',
    parameters: createSlideSchema,
});

export const editSlideTool = tool({
    description: 'Edit an existing slide by replacing its content',
    parameters: editSlideSchema,
});

export const aiTools = {
    read_slide: readSlideTool,
    read_deck: readDeckTool,
    create_slide: createSlideTool,
    edit_slide: editSlideTool,
};
