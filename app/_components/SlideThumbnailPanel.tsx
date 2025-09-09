'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import * as htmlToImage from 'html-to-image'
import { Button } from '@/components/ui/button'
import { Plus, X, Loader2, AlertCircle } from 'lucide-react'
import { useDebouncedCallback } from 'use-debounce';

interface SlideThumbnailPanelProps {
    isOpen: boolean
    onClose: () => void
}

type Page = {
    id: string
    name: string
    component: any
    // Add other GrapesJS Page properties as needed
    getId: () => string;
    getMainComponent: () => any;
    get: (key: string) => any;
};

type Editor = {
    Pages: {
        getAll: () => Page[];
        select: (page: Page | string) => void;
        getSelected: () => Page | undefined;
    };
    getHtml: (options?: { component?: any }) => string;
    getCss: (options?: { component?: any }) => string;
    on: (event: string, callback: (...args: any[]) => void) => void;
    off: (event: string, callback: (...args: any[]) => void) => void;
};


export default function SlideThumbnailPanel({ isOpen, onClose }: SlideThumbnailPanelProps) {
    const [slides, setSlides] = useState<Page[]>([])
    const [activeSlideId, setActiveSlideId] = useState<string | null>(null)
    const [thumbnails, setThumbnails] = useState<Map<string, string>>(new Map())
    const [loadingThumbnails, setLoadingThumbnails] = useState<Set<string>>(new Set())
    const [failedThumbnails, setFailedThumbnails] = useState<Set<string>>(new Set())
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
            width: '1024px',
            height: '576px',
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
        if (!editor || !sandboxRef.current) return;

        const id = page.getId();

        // Set loading state
        setLoadingThumbnails(prev => new Set(prev).add(id));
        setFailedThumbnails(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
        });

        try {
            const cmp = page.getMainComponent();
            const html = editor.getHtml({ component: cmp });
            const css = editor.getCss({ component: cmp });

            const doc = sandboxRef.current.contentDocument;
            if (!doc) throw new Error('No document available');

            // Write content to iframe
            doc.open();
            doc.write(`<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${html}</body></html>`);
            doc.close();

            // Wait for iframe to be ready and content to load
            await new Promise<void>((resolve, reject) => {
                let attempts = 0;
                const maxAttempts = 50; // 5 seconds max wait

                const checkReady = () => {
                    attempts++;
                    if (doc.readyState === 'complete' && doc.body) {
                        // Additional wait for any images or fonts to load
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
                canvasWidth: 480,
                canvasHeight: 270,
                pixelRatio: 0.5,
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
            // Clear loading state
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
        if (!isOpen) return;

        const editor = getEditor();
        if (!editor) {
            // Retry getting editor if not available immediately
            const interval = setInterval(() => {
                const editorInstance = getEditor();
                if (editorInstance) {
                    editorRef.current = editorInstance;
                    clearInterval(interval);
                    // Initial setup once editor is found
                    syncSlidesFromEditor();
                    refreshAllThumbs();
                }
            }, 100);
            return () => clearInterval(interval);
        }

        editorRef.current = editor;

        const handlePageUpdate = () => {
            syncSlidesFromEditor();
            refreshAllThumbs();
        };

        const handleSelection = () => {
            syncSlidesFromEditor();
        };

        const handleContentChange = () => {
            const selected = editor.Pages.getSelected();
            if (selected) {
                debouncedRenderThumb(selected);
            }
        };

        // Initial sync
        syncSlidesFromEditor();
        refreshAllThumbs();

        // More specific event listeners to reduce unnecessary updates
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

    }, [isOpen, getEditor, syncSlidesFromEditor, refreshAllThumbs, debouncedRenderThumb]);


    const handleSlideClick = (page: Page) => {
        const editor = getEditor();
        if (editor) {
            editor.Pages.select(page);
        }
    };

    const handleAddSlide = () => {
        if (typeof window !== 'undefined' && window.grapesjsAITools) {
            window.grapesjsAITools.addSlide(`Slide ${slides.length + 1}`, '')
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed bottom-0 left-20 right-0 h-24 bg-background border-t border-border z-40 shadow-lg">
            <div className="flex h-full px-4 py-2 overflow-x-auto overflow-y-hidden">
                <div className="flex gap-3 items-center min-w-0">
                    {/* Slides label and close button */}
                    <div className="flex-shrink-0 flex items-center gap-2 pr-4 border-r border-border">
                        <h3 className="font-semibold text-foreground text-sm">Slides</h3>
                        <Button variant="ghost" size="icon" onClick={onClose} className="h-5 w-5">
                            <X className="w-3 h-3" />
                        </Button>
                    </div>

                    {/* Thumbnails container */}
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
                                    className={`flex-shrink-0 p-1 border rounded-lg cursor-pointer transition-colors ${activeSlideId === id ? 'border-primary bg-primary/10' : 'border-border hover:bg-accent'
                                        }`}
                                    onClick={() => handleSlideClick(slide)}
                                >
                                    <div className="w-16 aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden relative mb-1">
                                        {thumbnailUrl ? (
                                            <img src={thumbnailUrl} alt={name} className="w-full h-full object-cover" />
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
                                    <p className="text-xs text-foreground truncate text-center w-16">{name}</p>
                                </div>
                            )
                        })}

                        {/* Add slide button */}
                        <div className="flex-shrink-0 p-1">
                            <div
                                className="w-16 aspect-video bg-muted border-2 border-dashed border-border rounded-md flex items-center justify-center cursor-pointer hover:bg-accent transition-colors mb-1"
                                onClick={handleAddSlide}
                            >
                                <Plus className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <p className="text-xs text-muted-foreground text-center w-16">Add Slide</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
