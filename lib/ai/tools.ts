import { tool } from 'ai';
import { z } from 'zod';

export const readSlideSchema = z.object({
    slideIndex: z.number().describe('Index of the slide to read (0-based)'),
});

export const readDeckSchema = z.object({
    includeNames: z.boolean().default(true).describe('Whether to include slide names'),
});

export const generateSlideSchema = z.object({
    name: z.string().describe('Name/title for the new slide'),
    content: z.string().describe('HTML content for the slide'),
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

export const generateSlideTool = tool({
    description: 'Generate a new slide with specified content',
    parameters: generateSlideSchema,
});

export const editSlideTool = tool({
    description: 'Edit an existing slide by replacing its content',
    parameters: editSlideSchema,
});

export const aiTools = {
    read_slide: readSlideTool,
    read_deck: readDeckTool,
    generate_slide: generateSlideTool,
    edit_slide: editSlideTool,
};
