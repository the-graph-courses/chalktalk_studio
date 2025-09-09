# ChalkTalk Studio

A modern presentation creation tool built with Next.js 15.5, featuring AI-powered slide generation and real-time collaboration.

## Features

- 🤖 **AI-Powered Slide Creation** - Generate slides using OpenAI and OpenRouter
- 🎨 **Modern UI** - Built with Tailwind CSS v4 and Radix UI components  
- 🔄 **Real-time Collaboration** - Powered by Convex backend
- 🔐 **Secure Authentication** - Clerk integration for user management
- 💬 **AI Chat Assistant** - Ephemeral chat for slide editing help
- 📱 **Responsive Design** - Works on desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 15.5 with React 19.1 and TurboPack
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS v4 with custom animations
- **Database**: Convex for real-time backend
- **Authentication**: Clerk
- **AI**: OpenAI API and OpenRouter
- **UI Components**: Radix UI primitives with shadcn/ui

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd chalktalk-studio
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Context7 MCP Integration

This project includes Context7 MCP for enhanced AI assistance. AI assistants can access up-to-date documentation by appending `use context7` to prompts.

See [docs/context7-setup.md](./docs/context7-setup.md) for detailed setup instructions.

## Project Structure

```
app/
├── _components/          # Shared components
├── (auth)/              # Authentication pages  
├── editor/[projectId]/  # Main slide editor
├── decks/              # Deck management
└── api/                # API routes

convex/                 # Backend functions and schema
components/ui/          # Reusable UI components
docs/                  # Documentation
lib/                   # Utilities and tools
```

## Documentation

- [API Reference](./docs/api-reference.md)
- [Component Documentation](./docs/components.md)
- [Context7 MCP Setup](./docs/context7-setup.md)

## Scripts

```bash
npm run dev          # Start development server with TurboPack
npm run build        # Build for production  
npm run start        # Start production server
npm run test:e2e     # Run Playwright tests
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if needed
5. Submit a pull request

## License

This project is licensed under the MIT License.
