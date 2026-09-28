import { fetchMutation, fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import { getSlideContainer } from './slide-formats';
import { projectCustomCss, slideBodyHtml, cssRelevantToHtml } from './reveal-export';

/** Load a project the user owns, with its project JSON parsed */
async function loadOwnedProject(projectId: string, userId: string) {
    const user = await fetchQuery(api.user.getUserByClerkId, { clerkId: userId });
    if (!user) {
        throw new Error('User not found');
    }

    const project = await fetchQuery(api.slideDeck.GetProject, { projectId });
    if (!project?.project) {
        throw new Error('Project not found');
    }

    if (project.uid !== user._id) {
        throw new Error('Unauthorized to access this project');
    }

    // Parse project data if needed
    let projectData = project.project;
    if (typeof projectData === 'string') {
        try {
            projectData = JSON.parse(projectData);
        } catch (error) {
            throw new Error('Invalid project data format');
        }
    }
    return projectData;
}

const headingOf = (html: string): string => {
    const m = html.match(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/i);
    return m ? m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : '';
};

/** One line per slide (index, name, headline) for the assistant's system prompt */
export async function getDeckOutline(projectId: string, userId: string, maxSlides = 60): Promise<string> {
    const projectData = await loadOwnedProject(projectId, userId);
    const pages: any[] = projectData.pages || [];
    if (!pages.length) return 'The deck is empty.';
    const lines = pages.slice(0, maxSlides).map((page, index) => {
        const html = slideBodyHtml(page);
        const heading = headingOf(html);
        const empty = !html.replace(/<[^>]+>/g, '').trim();
        const name = page.name || `Slide ${index + 1}`;
        return `${index}. ${name}${heading && heading !== name ? ` | "${heading}"` : ''}${empty ? ' (empty)' : ''}`;
    });
    if (pages.length > maxSlides) lines.push(`... and ${pages.length - maxSlides} more slides`);
    return `${pages.length} slide(s):\n${lines.join('\n')}`;
}

export async function executeSlideToolServer(
    toolName: string,
    parameters: any,
    projectId: string,
    userId: string // Pass the authenticated user ID
) {
    const projectData = await loadOwnedProject(projectId, userId);

    // Wrap slide bodies in the slide container unless the caller already sent one.
    // (Custom <style> blocks are part of the body: they must not skip wrapping, and their
    // width/height values must not be touched.)
    const toSlideComponent = (content: string): string =>
        content.includes('data-slide-container') ? content : getSlideContainer(content);

    // Execute the tool logic directly
    switch (toolName) {
        case 'read_slide': {
            const { slideIndex } = parameters;
            const slide = projectData.pages?.[slideIndex];

            if (!slide) {
                throw new Error(`Slide ${slideIndex} not found`);
            }

            const html = slideBodyHtml(slide);
            const customCss = cssRelevantToHtml(projectCustomCss(projectData), html);
            return {
                success: true,
                slideIndex,
                slideName: slide.name || `Slide ${slideIndex + 1}`,
                html,
                ...(customCss && { customCss }),
                note: 'Saved version of the slide; very recent edits may not be included yet.'
            };
        }

        case 'read_deck': {
            const { includeNames } = parameters;
            const allCss = projectCustomCss(projectData);
            const slides = projectData.pages?.map((page: any, index: number) => {
                const html = slideBodyHtml(page);
                const customCss = cssRelevantToHtml(allCss, html);
                return {
                    index,
                    name: includeNames ? (page.name || `Slide ${index + 1}`) : undefined,
                    html,
                    ...(customCss && { customCss }),
                };
            }) || [];

            return {
                success: true,
                totalSlides: slides.length,
                slides,
                note: 'Saved version of the deck; very recent edits may not be included yet.'
            };
        }

        case 'create_slide': {
            const { slideData } = parameters;

            // Extract data from whatever format the AI provided
            let name, content, insertAtIndex;

            if (typeof slideData === 'string') {
                // AI provided just content as a string
                content = slideData;
                name = 'New Slide';
            } else if (slideData && typeof slideData === 'object') {
                // AI provided structured data
                name = slideData.name || slideData.title || 'New Slide';
                content = slideData.content || slideData.html || slideData.body || '';
                insertAtIndex = slideData.insertAtIndex || slideData.position || slideData.index;
            } else {
                // Fallback
                content = '';
                name = 'New Slide';
            }

            // Guard: if content is empty, synthesize a minimal slide
            if (!content || (typeof content === 'string' && content.trim().length < 3)) {
                const safeTitle = name || 'New Slide';
                content = `<h1 style="position:absolute;left:60px;top:40px">${safeTitle}</h1>`;
            }

            content = toSlideComponent(content);

            return {
                success: true,
                command: 'addSlide',
                data: {
                    name,
                    content,
                    insertAtIndex,
                },
            };
        }

        case 'replace_slide': {
            const { slideIndex, slideData } = parameters;

            // Check if slide exists
            if (!projectData.pages?.[slideIndex]) {
                throw new Error(`Slide ${slideIndex} not found`);
            }

            // Extract data from whatever format the AI provided
            let newContent, newName;

            if (typeof slideData === 'string') {
                // AI provided just content as a string
                newContent = slideData;
            } else if (slideData && typeof slideData === 'object') {
                // AI provided structured data
                newContent = slideData.content || slideData.html || slideData.body || '';
                newName = slideData.name || slideData.title;
            } else {
                // Fallback
                newContent = '';
            }

            // Guard: if content is empty, keep a minimal placeholder
            if (!newContent || (typeof newContent === 'string' && newContent.trim().length < 3)) {
                const placeholder = `<p style="position:absolute;left:60px;top:40px">(empty slide)</p>`;
                newContent = placeholder;
            }

            newContent = toSlideComponent(newContent);

            return {
                success: true,
                command: 'replaceSlide',
                data: {
                    slideIndex,
                    newContent,
                    newName,
                },
            };
        }

        case 'delete_slide': {
            const { slideIndex } = parameters;

            // Check if slide exists
            if (!projectData.pages?.[slideIndex]) {
                throw new Error(`Slide ${slideIndex} not found`);
            }

            return {
                success: true,
                command: 'deleteSlide',
                data: {
                    slideIndex,
                },
            };
        }

        default:
            throw new Error(`Unknown tool: ${toolName}`);
    }
}
