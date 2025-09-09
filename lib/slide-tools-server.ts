import { fetchMutation, fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';

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
                data: {
                    index: slideIndex,
                    name: slide.name,
                    content: content,
                },
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
                data: {
                    totalSlides: slides.length,
                    slides,
                },
            };
        }

        case 'create_slide': {
            const { name, content = '', insertAtIndex } = parameters;

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
            const { slideIndex, newContent, newName } = parameters;

            // Check if slide exists
            if (!projectData.pages?.[slideIndex]) {
                throw new Error(`Slide ${slideIndex} not found`);
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
