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

        const projectData = project.project;

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
                const newSlide = { name, component: content };

                // Clone current project data
                const updatedProject = { ...projectData };
                if (!updatedProject.pages) {
                    updatedProject.pages = [];
                }

                // Insert at specified index or append
                if (insertAtIndex !== undefined && insertAtIndex >= 0) {
                    updatedProject.pages.splice(insertAtIndex, 0, newSlide);
                } else {
                    updatedProject.pages.push(newSlide);
                }

                // Save updated project
                await fetchMutation(api.slideDeck.SaveProject, {
                    projectId,
                    project: updatedProject,
                });

                return Response.json({
                    success: true,
                    data: {
                        slideIndex: insertAtIndex ?? updatedProject.pages.length - 1,
                        name: newSlide.name,
                        totalSlides: updatedProject.pages.length,
                    },
                });
            }

            case 'edit_slide': {
                const { slideIndex, newContent, newName } = parameters;

                // Clone current project data
                const updatedProject = { ...projectData };
                if (!updatedProject.pages?.[slideIndex]) {
                    return Response.json({ error: `Slide ${slideIndex} not found` }, { status: 404 });
                }

                const slide = updatedProject.pages[slideIndex];

                // Handle different project structures for editing
                if (slide.component && !slide.frames) {
                    // Simple structure (our test projects)
                    updatedProject.pages[slideIndex] = {
                        ...slide,
                        component: newContent,
                        ...(newName && { name: newName }),
                    };
                } else if (slide.frames?.[0]?.component) {
                    // Complex GrapesJS structure - prefer setting HTML component and removing frames
                    const updatedSlide: any = { ...slide };

                    // Set the HTML on component to ensure Studio can re-parse/render the slide
                    updatedSlide.component = newContent;

                    // Remove frames to avoid older nested structure overriding the HTML
                    delete updatedSlide.frames;

                    // Update name if provided
                    if (newName) {
                        updatedSlide.name = newName;
                    }

                    updatedProject.pages[slideIndex] = updatedSlide;
                } else {
                    // Fallback: ensure at least component is set
                    updatedProject.pages[slideIndex] = {
                        ...slide,
                        component: newContent,
                        ...(newName && { name: newName }),
                    };
                }

                // Save updated project
                await fetchMutation(api.slideDeck.SaveProject, {
                    projectId,
                    project: updatedProject,
                });

                return Response.json({
                    success: true,
                    data: {
                        slideIndex,
                        name: updatedProject.pages[slideIndex].name,
                        updated: true,
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
