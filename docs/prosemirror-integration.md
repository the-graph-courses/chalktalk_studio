# ProseMirror Rich Text Editor Integration

This document explains how ProseMirror RTE has been integrated into ChalkTalk Studio using the GrapesJS Studio SDK.

## Overview

We've replaced the default rich text editor with ProseMirror, a powerful and flexible rich-text editing framework. This provides users with enhanced text editing capabilities for slide content.

## Implementation Details

### Plugin Configuration

The ProseMirror RTE plugin is configured in `/app/editor/[projectId]/page.tsx` with the following features:

1. **Single-click activation**: Users can start editing text with a single click instead of double-click
2. **Persistent editing**: Escape key doesn't immediately exit edit mode to prevent accidental exits
3. **Custom toolbar**: Extended with slide-specific functionality

### Custom Toolbar Features

#### Slide Formatting Button
- **Icon**: Palette icon
- **Function**: Applies decorative formatting to selected text (adds sparkle emojis)
- **Usage**: Select text and click the palette button to enhance presentation content

#### Slide Variables Dropdown
A dropdown menu that allows users to insert common slide placeholders:
- `{{ title }}` - Slide Title
- `{{ subtitle }}` - Subtitle  
- `{{ author }}` - Author Name
- `{{ date }}` - Current Date
- `{{ company }}` - Company Name

### Enhanced Enter Key Behavior

The integration includes custom Enter key handling that creates line breaks optimized for slide presentation formatting.

## Usage

1. **Text Editing**: Click once on any text element to start editing with ProseMirror
2. **Formatting**: Use the standard formatting buttons (bold, italic, underline, lists, links)
3. **Slide-specific Tools**: 
   - Use the palette button to apply slide formatting to selected text
   - Use the variables dropdown to insert placeholder text
4. **Exit Editing**: Click outside the text area or press Escape to finish editing

## Benefits

- **Enhanced UX**: More intuitive editing with single-click activation
- **Rich Formatting**: Full range of text formatting options
- **Slide-optimized**: Custom tools designed specifically for presentation content
- **Consistent Behavior**: Standardized across all text elements in slides

## Technical Notes

- The plugin integrates seamlessly with the existing GrapesJS Studio SDK setup
- All default ProseMirror plugins are included for maximum compatibility
- Custom toolbar items leverage the GrapesJS command system
- The implementation follows the official ProseMirror RTE plugin documentation patterns

## Future Enhancements

Potential improvements could include:
- Custom ProseMirror schema extensions for slide-specific elements
- Integration with slide templates for automatic text styling
- Advanced placeholder replacement with dynamic content
- Collaborative editing capabilities
