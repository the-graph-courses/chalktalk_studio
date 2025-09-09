# Development Guide

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Copy `.env.example` to `.env.local` and configure:
   ```bash
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key

   # Convex Database
   NEXT_PUBLIC_CONVEX_URL=your_convex_url
   CONVEX_DEPLOY_KEY=your_convex_deploy_key

   # OpenAI API
   OPENAI_API_KEY=your_openai_api_key

   # OpenRouter API (optional)
   OPENROUTER_API_KEY=your_openrouter_api_key
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

## Architecture

### Frontend Structure

- **App Router**: Using Next.js 15 App Router pattern
- **Components**: Modular component architecture with shadcn/ui
- **State Management**: React Context for global state
- **Styling**: Tailwind CSS v4 with custom animations

### Backend Structure

- **Convex Functions**: Server-side functions for data operations
- **API Routes**: Next.js API routes for external integrations
- **Real-time Updates**: Convex provides real-time data synchronization

### Key Files

- `app/editor/[projectId]/page.tsx` - Main editor interface
- `app/_components/EphemeralChatPanel.tsx` - AI chat interface
- `lib/slide-tools.ts` - Client-side slide utilities
- `lib/slide-tools-server.ts` - Server-side slide processing
- `convex/slideDeck.ts` - Database operations

## Development Workflow

### Adding New Slide Templates

1. Define template in `lib/slide-templates.ts`
2. Add format definition to `lib/slide-formats.ts`
3. Update slide creation tools in `lib/slide-tools.ts`
4. Test with AI chat interface

### Creating New Components

1. Use shadcn/ui pattern in `components/ui/`
2. Follow TypeScript strict mode requirements
3. Add proper prop types and documentation
4. Include responsive design considerations

### API Integration

1. Add route handlers in `app/api/`
2. Use Arcjet for rate limiting
3. Implement proper error handling
4. Add TypeScript types for request/response

## Testing

### End-to-End Tests

```bash
npm run test:e2e        # Run all tests
npm run test:e2e:ui     # Run with UI
npm run test:e2e:debug  # Debug mode
```

### Manual Testing

1. Create new slide deck
2. Test AI chat functionality
3. Verify slide operations (create, edit, delete)
4. Test authentication flow
5. Check responsive design

## Debugging

### Common Issues

1. **Convex Connection**: Check environment variables and deployment
2. **Authentication**: Verify Clerk configuration
3. **AI Responses**: Check API keys and rate limits
4. **Build Errors**: Ensure TypeScript strict mode compliance

### Debug Tools

- React DevTools for component inspection
- Convex Dashboard for database queries
- Network tab for API debugging
- Console logs for runtime issues

## Performance

### Optimization Strategies

1. **TurboPack**: Enabled for faster builds
2. **Code Splitting**: Automatic with Next.js App Router
3. **Image Optimization**: Next.js Image component
4. **Caching**: Convex provides optimized caching

### Monitoring

- Check bundle size with `npm run build`
- Monitor API response times
- Use React Profiler for component performance
- Monitor Convex function execution times
