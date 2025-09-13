import { fetchMutation, fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import { getSlideContainer, DEFAULT_SLIDE_FORMAT } from './slide-formats';

export async function executeSlideToolServer(
    toolName: string,
    parameters: any,
    projectId: string,
    userId: string // Pass the authenticated user ID
) {
    // Get user and verify project ownership
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

    const isCompleteSlideContainer = (content: string): boolean =>
        content.includes('data-slide-container') || content.includes('<style>');

    const enforceProjectDimensions = (content: string): string => {
        if (!isCompleteSlideContainer(content)) return content;
        return content
            .replace(/width:\s*\d+px/g, `width: ${DEFAULT_SLIDE_FORMAT.width}px`)
            .replace(/height:\s*\d+px/g, `height: ${DEFAULT_SLIDE_FORMAT.height}px`);
    };

    // Execute the tool logic directly
    switch (toolName) {
        case 'read_slide': {
            const { slideIndex } = parameters;
            const slide = projectData.pages?.[slideIndex];

            if (!slide) {
                throw new Error(`Slide ${slideIndex} not found`);
            }

            // Handle different project structures
            let content = '';
            if (slide.component) {
                // Simple structure (our test projects)
                content = slide.component;
            } else if (slide.frames?.[0]?.component) {
                // Complex GrapesJS structure
                const frame = slide.frames[0];
                const component = frame.component;

                // Try to extract meaningful content
                if (component.components?.[0]?.content) {
                    content = component.components[0].content;
                } else {
                    // Fallback: serialize the entire component
                    content = JSON.stringify(component, null, 2);
                }
            }

            return {
                success: true,
                slideIndex,
                slideName: slide.name,
                slideContent: content,
            };
        }

        case 'read_deck': {
            const { includeNames } = parameters;
            const slides = projectData.pages?.map((page: any, index: number) => {
                // Handle different project structures
                let content = '';
                if (page.component) {
                    // Simple structure (our test projects)
                    content = page.component;
                } else if (page.frames?.[0]?.component) {
                    // Complex GrapesJS structure
                    const frame = page.frames[0];
                    const component = frame.component;

                    // Try to extract meaningful content
                    if (component.components?.[0]?.content) {
                        content = component.components[0].content;
                    } else {
                        // Fallback: serialize the entire component
                        content = JSON.stringify(component, null, 2);
                    }
                }

                return {
                    index,
                    name: includeNames ? page.name : undefined,
                    content: content,
                };
            }) || [];

            return {
                success: true,
                totalSlides: slides.length,
                slides,
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

            if (!isCompleteSlideContainer(content)) {
                content = getSlideContainer(content);
            } else {
                content = enforceProjectDimensions(content);
            }

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

            if (!isCompleteSlideContainer(newContent)) {
                newContent = getSlideContainer(newContent);
            } else {
                newContent = enforceProjectDimensions(newContent);
            }

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

        default:
            throw new Error(`Unknown tool: ${toolName}`);
    }
}
