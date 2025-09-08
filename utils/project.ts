/**
 * Utility functions for project management
 */

/**
 * Extract project ID from the current URL path
 * Returns null if not in an editor context
 */
export function getCurrentProjectId(): string | null {
    if (typeof window === 'undefined') return null;

    const path = window.location.pathname;
    const match = path.match(/\/editor\/([^\/]+)/);
    return match ? match[1] : null;
}

/**
 * Check if we're currently in an editor context
 */
export function isInEditorContext(): boolean {
    return getCurrentProjectId() !== null;
}
