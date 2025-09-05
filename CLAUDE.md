# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server with TurboPack
npm run dev

# Build for production with TurboPack
npm run build

# Start production server
npm run start
```

## Architecture Overview

This is a Next.js 15.5 application for trip planning with the following key architectural components:

### Stack
- **Frontend Framework**: Next.js 15.5 with React 19.1 and TurboPack
- **Language**: TypeScript with strict mode enabled
- **Styling**: Tailwind CSS v4 with custom animations (tw-animate-css)
- **Database**: Convex for real-time backend
- **Authentication**: Clerk for user management
- **AI Integration**: OpenAI API for trip generation
- **Rate Limiting**: Arcjet for API protection
- **UI Components**: Radix UI primitives with custom shadcn/ui components

### Project Structure

- **`app/`**: Next.js App Router directory
  - `(auth)/`: Authentication pages (sign-in, sign-up) using Clerk
  - `create-new-trip/`: Main trip creation interface with ChatBox and Itinerary components
  - `api/`: API routes for AI model, Google Places, and Arcjet integration
  - `_components/`: Shared application components (Header, Sidebar, LayoutWrapper)

- **`convex/`**: Backend schema and functions
  - Database tables: `UserTable` and `TripDetailTable`
  - Functions for user and trip management

- **`components/ui/`**: Reusable UI components (shadcn/ui pattern)

- **`context/`**: React Context providers
  - `TripDetailContext`: Manages trip information state
  - `UserDetailContext`: Manages user state

### Key Architectural Patterns

1. **Authentication Flow**: Clerk middleware protects routes except `/`, `/sign-in`, and `/sign-up`

2. **Provider Hierarchy** (app/layout.tsx):
   - ClerkProvider → ConvexClientProvider → Provider → LayoutWrapper

3. **State Management**: React Context for trip and user details, Convex for persistent data

4. **API Integration**: 
   - Google Places API for location data
   - OpenAI API for trip generation
   - Arcjet for rate limiting and security

5. **Path Aliases**: `@/*` maps to project root for clean imports

## Important Configuration

- **TypeScript**: Strict mode enabled with bundler module resolution
- **Images**: Remote patterns configured for Unsplash, Google Places, and Aceternity assets
- **Middleware**: Authentication enforcement on protected routes