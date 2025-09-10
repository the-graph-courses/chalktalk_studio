# Public Editor for Testing

This application includes a public editor that can be accessed without authentication, designed for testing and demonstration purposes.

## Accessing the Public Editor

### Method 1: Demo Page (Recommended)
Visit `/demo` in your browser, which will automatically redirect to a demo project:
```
http://localhost:3001/demo
```

### Method 2: Direct Access
Access the public editor directly with any project ID:
```
http://localhost:3001/public-editor/[project-id]
```

For example:
```
http://localhost:3001/public-editor/demo-project
http://localhost:3001/public-editor/test-slides
```

## Key Differences from Authenticated Editor

### ✅ What's Available in Public Mode:
- **Full Editor Functionality**: All slide creation and editing features
- **Blocks Panel**: Always visible on the left sidebar
- **Properties & Styles Tabs**: Right sidebar with tabbed interface
- **Layers Panel**: Bottom section of right sidebar with "Layers" title
- **Canvas Tools**: Zoom, pan, and all standard editor tools
- **AI Integration**: Access to AI tools for slide generation

### 🔄 What's Different:
- **Authentication**: No login required
- **Storage**: Saves to browser's localStorage instead of database
- **Persistence**: Projects persist in the browser but are not shared
- **User Context**: Uses anonymous identity
- **Demo Header**: Shows "Public Demo Mode" indicator

### ❌ Limitations:
- **No Cloud Sync**: Changes are stored locally only
- **No User Management**: Cannot save/load user-specific projects
- **No Collaboration**: Single-user only
- **No Export Options**: Limited sharing capabilities

## Use Cases

### For Testing:
- **AI Assistant Testing**: Test AI slide generation without authentication
- **UI/UX Testing**: Verify editor functionality across devices
- **Feature Development**: Test new features before authentication integration
- **Performance Testing**: Benchmark editor performance

### For Demonstration:
- **Client Presentations**: Show editor capabilities without login
- **Team Reviews**: Share editor features with stakeholders
- **Training**: Demonstrate editor usage to new team members

## Technical Implementation

### Architecture:
- **Shared Components**: Reuses the same editor components as authenticated version
- **Conditional Logic**: Different storage and authentication handling
- **Middleware Bypass**: Public routes excluded from authentication middleware

### Files Created:
- `/app/public-editor/[projectId]/page.tsx` - Main public editor page
- `/app/demo/page.tsx` - Demo redirect page
- Updated `middleware.ts` - Added public routes to bypass authentication

### Storage Strategy:
- **localStorage**: Browser-based storage for demo projects
- **Project Isolation**: Each project ID gets its own localStorage key
- **Fallback Logic**: Graceful fallback to demo content if localStorage fails

## Getting Started

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Access the demo**:
   - Visit `http://localhost:3001/demo` for auto-redirect
   - Or visit `http://localhost:3001/public-editor/demo-project` directly

3. **Start creating slides**:
   - Use the blocks panel on the left to add components
   - Switch between Properties and Styles tabs on the right
   - View layers in the bottom panel of the right sidebar

## Security Considerations

⚠️ **Important**: The public editor is designed for testing only. In production:

- Consider implementing rate limiting for public routes
- Add project expiration/cleanup for localStorage
- Implement access controls for sensitive features
- Monitor usage patterns for abuse prevention

## Future Enhancements

Potential improvements for the public editor:
- **Project Sharing**: Allow sharing public projects via URL
- **Export Options**: Add PDF/image export capabilities
- **Collaboration**: Implement real-time collaboration for public projects
- **Templates**: Pre-built demo templates for different use cases
