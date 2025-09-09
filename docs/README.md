# ChalkTalk Studio Documentation

Welcome to ChalkTalk Studio - a Next.js 15.5 application for creating presentation slides and decks.

## Architecture Overview

This is a Next.js 15.5 application with the following key components:

### Tech Stack
- **Frontend Framework**: Next.js 15.5 with React 19.1 and TurboPack
- **Language**: TypeScript with strict mode enabled
- **Styling**: Tailwind CSS v4 with custom animations (tw-animate-css)
- **Database**: Convex for real-time backend
- **Authentication**: Clerk for user management
- **AI Integration**: OpenAI API and OpenRouter for slide generation
- **Rate Limiting**: Arcjet for API protection
- **UI Components**: Radix UI primitives with custom shadcn/ui components

### Project Structure

- **`app/`**: Next.js App Router directory
  - `(auth)/`: Authentication pages (sign-in, sign-up) using Clerk
  - `editor/[projectId]/`: Main slide editor interface
  - `decks/`: Deck management page
  - `api/`: API routes for AI, chat, and external integrations
  - `_components/`: Shared application components (Header, Sidebar, Chat Panel, etc.)

- **`convex/`**: Backend schema and functions
  - Database tables: `UserTable` and `SlideDeckTable`
  - Functions for user and slide deck management

- **`components/ui/`**: Reusable UI components (shadcn/ui pattern)

- **`context/`**: React Context providers
  - `UserDetailContext`: Manages user state

- **`lib/`**: Utility libraries
  - `slide-tools.ts`: Client-side slide manipulation tools
  - `slide-tools-server.ts`: Server-side slide processing
  - `slide-formats.ts`: Slide format definitions
  - `slide-templates.ts`: Pre-built slide templates

### Key Features

1. **Slide Creation**: AI-powered slide generation with various templates
2. **Real-time Editing**: Live slide editing with thumbnail preview
3. **Context Menu**: Right-click actions for slide operations
4. **Chat Interface**: Ephemeral chat for AI assistance
5. **Deck Management**: Create, save, and manage multiple slide decks

### API Endpoints

- `/api/ai/tools`: AI tool integration for slide operations
- `/api/ai/tests/`: Test endpoints for slide operations
- `/api/chat/ephemeral`: Ephemeral chat with AI assistance

### Authentication

Uses Clerk for authentication with middleware protecting all routes except:
- `/` (home page)
- `/sign-in`
- `/sign-up`

### Development

```bash
npm run dev          # Start development server with TurboPack
npm run build        # Build for production
npm run test:e2e     # Run end-to-end tests
```

## Context7 MCP Integration

This project includes Context7 MCP for AI assistants to access up-to-date documentation.

To use Context7 in your prompts, append `use context7` to your questions:

```
How do I create a new slide template? use context7
```

This will fetch the latest documentation and provide accurate, version-specific responses.
