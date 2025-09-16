/**
 * Feature Flags Configuration
 * 
 * This file contains feature toggles that can be easily modified to enable/disable
 * functionality during development and debugging.
 */

export const FEATURES = {
    /**
     * THUMBNAIL_PANEL - Controls the slide thumbnail panel at the bottom of the editor
     * 
     * Status: TEMPORARILY DISABLED (2025-09-16)
     * Reason: Thumbnail creator causing issues, needs debugging
     * 
     * To re-enable:
     * 1. Set THUMBNAIL_PANEL to true
     * 2. Test thumbnail generation functionality
     * 3. Debug any remaining issues in SlideThumbnailPanel.tsx
     * 
     * Related files:
     * - app/_components/SlideThumbnailPanel.tsx (main component)
     * - app/_components/LayoutWrapper.tsx (renders the panel)
     */
    THUMBNAIL_PANEL: false,

    // Add more feature flags here as needed
    // EXAMPLE_FEATURE: true,
} as const;

export type FeatureFlags = typeof FEATURES;
