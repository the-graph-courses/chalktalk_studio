import { api } from '@/convex/_generated/api';
import { fetchMutation, fetchQuery } from 'convex/nextjs';

export async function POST(request: Request) {
    try {
        const { toolName, parameters, projectId } = await request.json();

        if (!projectId) {
            return Response.json({ error: 'Project ID is required' }, { status: 400 });
        }

        // Get current project
        const project = await fetchQuery(api.slideDeck.GetProject, { projectId });
        if (!project?.project) {
            return Response.json({ error: 'Project not found' }, { status: 404 });
        }

        // Handle case where project might still be a string
        let projectData = project.project;
        if (typeof projectData === 'string') {
            try {
                projectData = JSON.parse(projectData);
            } catch (error) {
                console.error('Failed to parse project data in tools API:', error);
                return Response.json({ error: 'Invalid project data format' }, { status: 500 });
            }
        }

        switch (toolName) {
            case 'read_slide': {
                const { slideIndex } = parameters;
                const slide = projectData.pages?.[slideIndex];

                if (!slide) {
                    return Response.json({ error: `Slide ${slideIndex} not found` }, { status: 404 });
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

                return Response.json({
                    success: true,
                    data: {
                        index: slideIndex,
                        name: slide.name,
                        content: content,
                    },
                });
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

                return Response.json({
                    success: true,
                    data: {
                        totalSlides: slides.length,
                        slides,
                    },
                });
            }

            case 'generate_slide': {
                const { name, content, insertAtIndex } = parameters;

                return Response.json({
                    success: true,
                    command: 'addSlide',
                    data: {
                        name,
                        content,
                        insertAtIndex,
                    },
                });
            }

            case 'edit_slide': {
                const { slideIndex, newContent, newName } = parameters;

                // Check if slide exists
                if (!projectData.pages?.[slideIndex]) {
                    return Response.json({ error: `Slide ${slideIndex} not found` }, { status: 404 });
                }

                return Response.json({
                    success: true,
                    command: 'editSlide',
                    data: {
                        slideIndex,
                        newContent,
                        newName,
                    },
                });
            }

            default:
                return Response.json({ error: `Unknown tool: ${toolName}` }, { status: 400 });
        }
    } catch (error) {
        console.error('Tool execution error:', error);
        return Response.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
