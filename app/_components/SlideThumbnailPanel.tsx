'use client'

/**
 * SlideThumbnailPanel Component
 * 
 * STATUS: TEMPORARILY DISABLED (2025-09-16)
 * This component is currently disabled via feature flag in lib/feature-flags.ts
 * due to thumbnail generation issues that need debugging.
 * 
 * To re-enable: Set FEATURES.THUMBNAIL_PANEL = true in lib/feature-flags.ts
 * 
 * Known issues to debug:
 * - Thumbnail creator causing problems (specific issues TBD)
 * - May need investigation of html-to-image library usage
 * - Canvas rendering issues in sandboxed iframe
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import * as htmlToImage from 'html-to-image'
import { Plus, Loader2, AlertCircle, MoreHorizontal } from 'lucide-react'
import { useDebouncedCallback } from 'use-debounce';
import SlideContextMenu from './SlideContextMenu';

interface SlideThumbnailPanelProps {
    // No props needed
}

type Page = {
    id: string
    name: string
    component: any
    getId: () => string;
    getMainComponent: () => any;
    get: (key: string) => any;
};

type Editor = {
    Pages: {
        getAll: () => Page[];
        select: (page: Page | string) => void;
        getSelected: () => Page | undefined;
        add: (page: { name?: string; component?: any; styles?: any }, options?: { at?: number; select?: boolean }) => Page;
        remove: (page: Page) => void;
    };
    getHtml: (options?: { component?: any }) => string;
    getCss: (options?: { component?: any }) => string;
    on: (event: string, callback: (...args: any[]) => void) => void;
    off: (event: string, callback: (...args: any[]) => void) => void;
};


export default function SlideThumbnailPanel({ }: SlideThumbnailPanelProps) {
    const [slides, setSlides] = useState<Page[]>([])
    const [activeSlideId, setActiveSlideId] = useState<string | null>(null)
    const [thumbnails, setThumbnails] = useState<Map<string, string>>(new Map())
    const [loadingThumbnails, setLoadingThumbnails] = useState<Set<string>>(new Set())
    const [failedThumbnails, setFailedThumbnails] = useState<Set<string>>(new Set())
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; slideId: string } | null>(null);
    const sandboxRef = useRef<HTMLIFrameElement | null>(null)
    const editorRef = useRef<Editor | null>(null);


    const getEditor = useCallback(() => {
        if (typeof window !== 'undefined' && window.grapesjsAITools) {
            return window.grapesjsAITools.getEditor() as Editor || null;
        }
        return null;
    }, []);

    // Create and cleanup the sandbox iframe
    useEffect(() => {
        const sandbox = document.createElement('iframe');
        Object.assign(sandbox.style, {
            position: 'fixed',
            left: '-10000px',
            top: '0',
            width: '800px',
            height: '450px',
        });
        document.body.appendChild(sandbox);
        sandboxRef.current = sandbox;

        return () => {
            if (sandbox.parentElement) {
                sandbox.parentElement.removeChild(sandbox);
            }
            sandboxRef.current = null;
        };
    }, []);


    const renderThumb = useCallback(async (page: Page) => {
        const editor = getEditor();
        if (!editor || !sandboxRef.current) {
            console.warn('Editor or sandbox not available for thumbnail generation');
            return;
        }

        const id = page.getId();
        if (!id) {
            console.warn('Page ID not available');
            return;
        }

        setLoadingThumbnails(prev => new Set(prev).add(id));
        setFailedThumbnails(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
        });

        try {
            const cmp = page.getMainComponent();
            if (!cmp) throw new Error('No main component found');

            const html = editor.getHtml({ component: cmp });
            const css = editor.getCss({ component: cmp });

            if (!html) throw new Error('No HTML content generated');

            const doc = sandboxRef.current.contentDocument;
            if (!doc) throw new Error('No document available');

            doc.open();
            doc.write(`<!doctype html><html><head><meta charset="utf-8"><style>
                body {
                    margin: 0;
                    padding: 0;
                    width: 100%;
                    height: 100%;
                    background: #f0f2f5;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                }
                ${css}
            </style></head><body>${html}</body></html>`);
            doc.close();

            await new Promise<void>((resolve, reject) => {
                let attempts = 0;
                const maxAttempts = 50;

                const checkReady = () => {
                    attempts++;
                    if (doc.readyState === 'complete' && doc.body) {
                        setTimeout(resolve, 200);
                    } else if (attempts >= maxAttempts) {
                        reject(new Error('Timeout waiting for iframe to load'));
                    } else {
                        setTimeout(checkReady, 100);
                    }
                };
                checkReady();
            });

            const node = doc.body;
            if (!node) throw new Error('No body element found');

            const dataUrl = await htmlToImage.toPng(node, {
                canvasWidth: 800,
                canvasHeight: 450,
                pixelRatio: 0.3,
                skipFonts: false,
                cacheBust: true,
                style: {
                    transform: 'scale(1)',
                    transformOrigin: 'top left',
                }
            });

            setThumbnails(prev => new Map(prev).set(id, dataUrl));
        } catch (error) {
            console.error(`Thumbnail generation failed for page ${id}:`, error);
            setFailedThumbnails(prev => new Set(prev).add(id));
        } finally {
            setLoadingThumbnails(prev => {
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
            });
        }
    }, [getEditor]);

    const refreshAllThumbs = useCallback(async () => {
        const editor = getEditor();
        if (!editor) return;

        const pages = editor.Pages.getAll();
        for (const p of pages) {
            await renderThumb(p);
        }
    }, [getEditor, renderThumb]);

    const syncSlidesFromEditor = useCallback(() => {
        const editor = getEditor();
        if (!editor) return;
        const pages = editor.Pages.getAll();
        const selected = editor.Pages.getSelected();
        setSlides([...pages]);
        setActiveSlideId(selected?.getId() || null);
    }, [getEditor]);

    const debouncedRenderThumb = useDebouncedCallback((page: Page) => {
        renderThumb(page);
    }, 500);


    // Effect to setup editor listeners
    useEffect(() => {
        const editor = getEditor();
        if (!editor) {
            let attempts = 0;
            const maxAttempts = 100; // Wait up to 10 seconds
            const interval = setInterval(() => {
                attempts++;
                const editorInstance = getEditor();
                if (editorInstance) {
                    console.log('Editor found after', attempts, 'attempts');
                    editorRef.current = editorInstance;
                    clearInterval(interval);
                    syncSlidesFromEditor();
                    // Add a delay before generating thumbnails to ensure editor is fully ready
                    setTimeout(() => {
                        refreshAllThumbs();
                    }, 500);
                } else if (attempts >= maxAttempts) {
                    console.error('Editor not found after maximum attempts');
                    clearInterval(interval);
                }
            }, 100);
            return () => clearInterval(interval);
        }

        console.log('Editor available immediately');
        editorRef.current = editor;

        const handlePageUpdate = () => {
            console.log('Page update event triggered');
            syncSlidesFromEditor();
            // Add delay to ensure the editor state is updated
            setTimeout(() => {
                refreshAllThumbs();
            }, 100);
        };

        const handleSelection = (page: Page, previousPage?: Page) => {
            if (page?.getId) {
                setActiveSlideId(page.getId());
            }
        };

        const handleContentChange = () => {
            const selected = editor.Pages.getSelected();
            if (selected) {
                debouncedRenderThumb(selected);
            }
        };

        syncSlidesFromEditor();
        // Add delay before initial thumbnail generation
        setTimeout(() => {
            refreshAllThumbs();
        }, 500);

        editor.on('page:add page:remove', handlePageUpdate);
        editor.on('page:select', handleSelection);
        editor.on('component:add component:remove component:update', handleContentChange);
        editor.on('style:update', handleContentChange);

        return () => {
            editor.off('page:add page:remove', handlePageUpdate);
            editor.off('page:select', handleSelection);
            editor.off('component:add component:remove component:update', handleContentChange);
            editor.off('style:update', handleContentChange);
        };

    }, [getEditor, syncSlidesFromEditor, refreshAllThumbs, debouncedRenderThumb]);


    const handleSlideClick = (page: Page) => {
        const editor = getEditor();
        if (editor) {
            editor.Pages.select(page);
        }
    };

    const handleAddSlide = () => {
        if (typeof window !== 'undefined' && window.grapesjsAITools) {
            window.grapesjsAITools.addSlide(`Slide ${slides.length + 1}`, '')
            // Immediately sync slides and generate thumbnails
            setTimeout(() => {
                syncSlidesFromEditor();
                refreshAllThumbs();
            }, 200);
        }
    }

    // Debug function to manually refresh thumbnails
    const debugRefreshThumbnails = useCallback(() => {
        console.log('Debug: Manually refreshing thumbnails');
        console.log('Editor available:', !!getEditor());
        console.log('Sandbox available:', !!sandboxRef.current);
        console.log('Current slides:', slides.length);
        refreshAllThumbs();
    }, [getEditor, slides.length, refreshAllThumbs]);

    // Add to window for debugging
    useEffect(() => {
        if (typeof window !== 'undefined') {
            (window as any).debugThumbnails = debugRefreshThumbnails;
        }
        return () => {
            if (typeof window !== 'undefined') {
                delete (window as any).debugThumbnails;
            }
        };
    }, [debugRefreshThumbnails]);

    const handleContextMenu = (event: React.MouseEvent, slideId: string) => {
        event.preventDefault();
        setContextMenu({ x: event.clientX, y: event.clientY, slideId });
    };

    const closeContextMenu = () => {
        setContextMenu(null);
    };

    const handleDuplicate = () => {
        if (!contextMenu) return;
        const editor = getEditor();
        if (!editor) return;

        const pageToDuplicate = editor.Pages.getAll().find(p => p.getId() === contextMenu.slideId);
        if (!pageToDuplicate) return;

        try {
            const newName = `${pageToDuplicate.get('name')} (Copy)`;
            // Clone the main component to preserve all structure
            const mainComponent = pageToDuplicate.getMainComponent();
            const clonedComponent = mainComponent.clone();

            // Find index of page to duplicate
            const pages = editor.Pages.getAll();
            const index = pages.findIndex(p => p.getId() === contextMenu.slideId);

            // Add new page after the original
            const newPage = editor.Pages.add({
                name: newName,
                component: clonedComponent
            }, { at: index + 1 });

            // Select the new page
            if (newPage) {
                editor.Pages.select(newPage);
                // Immediately update local state
                syncSlidesFromEditor();
                // Generate thumbnail for the new page
                setTimeout(() => {
                    renderThumb(newPage);
                }, 200);
            }
        } catch (error) {
            console.error('Error duplicating page:', error);
        }

        closeContextMenu();
    };

    const handleDelete = () => {
        if (!contextMenu) return;
        const editor = getEditor();
        if (!editor) return;

        const pages = editor.Pages.getAll();
        // Don't delete if it's the last page
        if (pages.length <= 1) {
            alert('Cannot delete the last page.');
            closeContextMenu();
            return;
        }

        const pageToDelete = pages.find(p => p.getId() === contextMenu.slideId);
        if (!pageToDelete) {
            closeContextMenu();
            return;
        }

        try {
            // If we're deleting the currently selected page, select another one first
            const selectedPage = editor.Pages.getSelected();
            if (selectedPage && selectedPage.getId() === contextMenu.slideId) {
                const remainingPages = pages.filter(p => p.getId() !== contextMenu.slideId);
                if (remainingPages.length > 0) {
                    editor.Pages.select(remainingPages[0]);
                }
            }

            // Remove the page
            editor.Pages.remove(pageToDelete);

            // Immediately update local state to reflect the deletion
            setSlides(prev => prev.filter(slide => slide.getId() !== contextMenu.slideId));
            setThumbnails(prev => {
                const newThumbnails = new Map(prev);
                newThumbnails.delete(contextMenu.slideId);
                return newThumbnails;
            });
            setLoadingThumbnails(prev => {
                const newSet = new Set(prev);
                newSet.delete(contextMenu.slideId);
                return newSet;
            });
            setFailedThumbnails(prev => {
                const newSet = new Set(prev);
                newSet.delete(contextMenu.slideId);
                return newSet;
            });
        } catch (error) {
            console.error('Error deleting page:', error);
        }

        closeContextMenu();
    };

    return (
        <div className="h-32 bg-background dark:bg-gray-600 border-t border-border z-40 shadow-lg">
            <div className="flex h-full px-4 py-2 overflow-x-auto overflow-y-hidden">
                <div className="flex gap-3 items-center min-w-0">
                    <div className="flex-shrink-0 flex items-center pr-4 border-r border-border">
                        <h3 className="font-semibold text-foreground text-sm">Slides</h3>
                    </div>

                    <div className="flex gap-2 items-center">
                        {slides.map((slide, index) => {
                            const id = slide.getId();
                            const name = slide.get('name') || `Slide ${index + 1}`
                            const thumbnailUrl = thumbnails.get(id);
                            const isLoading = loadingThumbnails.has(id);
                            const hasFailed = failedThumbnails.has(id);

                            return (
                                <div
                                    key={id}
                                    className={`group flex-shrink-0 p-1 border rounded-lg cursor-pointer transition-colors relative ${activeSlideId === id ? 'border-primary bg-primary/10' : 'border-border hover:bg-accent'
                                        }`}
                                    onClick={() => handleSlideClick(slide)}
                                    onContextMenu={(e) => handleContextMenu(e, id)}
                                >
                                    <button
                                        className="absolute top-1 right-1 z-10 p-0.5 bg-background rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            setContextMenu({ x: rect.left, y: rect.top, slideId: id });
                                        }}
                                    >
                                        <MoreHorizontal className="w-3 h-3" />
                                    </button>
                                    <div className="w-28 aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden relative">
                                        {thumbnailUrl ? (
                                            <>
                                                <img src={thumbnailUrl} alt={name} className="w-full h-full object-cover" />
                                                <span className="absolute bottom-1 left-2 text-white text-xs font-bold" style={{ textShadow: '0 0 5px rgba(0,0,0,0.9)' }}>
                                                    {index + 1}
                                                </span>
                                            </>
                                        ) : isLoading ? (
                                            <div className="w-full h-full bg-muted flex items-center justify-center">
                                                <Loader2 className="w-3 h-3 text-muted-foreground animate-spin" />
                                            </div>
                                        ) : hasFailed ? (
                                            <div className="w-full h-full bg-muted flex flex-col items-center justify-center">
                                                <AlertCircle className="w-3 h-3 text-destructive mb-0.5" />
                                                <span className="text-xs text-destructive">Failed</span>
                                            </div>
                                        ) : (
                                            <div className="w-full h-full bg-muted flex items-center justify-center">
                                                <span className="text-xs text-muted-foreground">Loading...</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}

                        <div className="flex-shrink-0 p-1">
                            <div
                                className="w-28 aspect-video bg-muted border-2 border-dashed border-border rounded-md flex items-center justify-center cursor-pointer hover:bg-accent transition-colors"
                                onClick={handleAddSlide}
                            >
                                <Plus className="w-6 h-6 text-muted-foreground" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {contextMenu && (
                <SlideContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={closeContextMenu}
                    onDuplicate={handleDuplicate}
                    onDelete={handleDelete}
                />
            )}
        </div>
    )
}
