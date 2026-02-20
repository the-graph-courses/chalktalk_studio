/**
 * Editor Commands Module
 *
 * Extracted from EphemeralChatPanel to make editor command execution
 * testable and to clearly define the interface between the AI chat
 * and the GrapesJS editor.
 *
 * The AITools interface documents ALL methods that executeEditorCommand
 * expects. StudioEditorComponent must provide these on window.grapesjsAITools.
 */

/** The interface that the editor must expose on window.grapesjsAITools */
export interface AITools {
    addSlide(name: string, content: string, insertAtIndex?: number): boolean;
    editSlide?(slideIndex: number, newContent: string, newName?: string): boolean;
    replaceSlide(slideIndex: number, newContent: string, newName?: string): boolean;
    deleteSlide(slideIndex: number): boolean;
    getSlideHtml(slideIndex: number): string | null;
    getSlideCss(slideIndex: number): string | null;
    getAllSlidesHtmlCss(): Array<{ index: number; name: string; html: string; css: string }> | null;
    getEditor(): any;
}

/** Augment the Window interface so TypeScript knows about grapesjsAITools */
declare global {
    interface Window {
        grapesjsAITools?: AITools;
    }
}

export interface EditorCommandOutput {
    command: string;
    data: Record<string, any>;
    message?: string;
    [key: string]: any;
}

export type CommandResult =
    | false
    | boolean
    | { error: string }
    | { success: true; [key: string]: any };

/**
 * Get the AITools instance from window, if available.
 * Returns null when running outside a browser or when the editor isn't loaded.
 */
export function getAITools(): AITools | null {
    if (typeof window === 'undefined') return null;
    return window.grapesjsAITools ?? null;
}

/**
 * Execute an editor command returned by the AI tool system.
 *
 * @param output - The command output from a server-side slide tool
 * @param aiTools - The editor tools interface (defaults to window.grapesjsAITools)
 * @returns The command result, or false if execution failed
 */
export function executeEditorCommand(
    output: EditorCommandOutput,
    aiTools?: AITools | null
): CommandResult {
    const tools = aiTools ?? getAITools();
    if (!tools || !output?.command) return false;

    const { command, data: commandData } = output;

    try {
        switch (command) {
            case 'addSlide':
                return tools.addSlide(
                    commandData.name,
                    commandData.content,
                    commandData.insertAtIndex
                );
            case 'replaceSlide':
                return tools.replaceSlide(
                    commandData.slideIndex,
                    commandData.newContent,
                    commandData.newName
                );
            case 'deleteSlide':
                return tools.deleteSlide(
                    commandData.slideIndex
                );
            case 'readSlide': {
                const html = tools.getSlideHtml(commandData.slideIndex);
                const css = tools.getSlideCss(commandData.slideIndex);

                if (html === null || css === null) {
                    return { error: `Slide ${commandData.slideIndex} not found` };
                }

                const editor = tools.getEditor();
                const pages = editor?.Pages?.getAll();
                const page = pages?.[commandData.slideIndex];
                const slideName = page?.getName() || page?.getId() || `Slide ${commandData.slideIndex + 1}`;

                return {
                    success: true,
                    slideIndex: commandData.slideIndex,
                    slideName,
                    html,
                    css
                };
            }
            case 'readDeck': {
                const slidesData = tools.getAllSlidesHtmlCss();
                if (!slidesData) return { error: 'Failed to read slides' };

                const slides = slidesData.map(slide => ({
                    index: slide.index,
                    name: commandData.includeNames ? slide.name : undefined,
                    html: slide.html,
                    css: slide.css
                }));

                return {
                    success: true,
                    totalSlides: slides.length,
                    slides
                };
            }
            default:
                return false;
        }
    } catch (error) {
        console.error('Error executing editor command:', error);
        return false;
    }
}

/**
 * Trigger the editor to persist its current state.
 */
export function triggerEditorSave(aiTools?: AITools | null): void {
    const tools = aiTools ?? getAITools();
    if (tools?.getEditor) {
        const editor = tools.getEditor();
        editor?.store();
    }
}
