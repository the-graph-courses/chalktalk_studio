# ChalkTalk Studio

A modern presentation creation tool built with Next.js, featuring AI-powered slide generation and real-time collaboration.

## Core Technologies

- **Framework**: Next.js 15.5 with React 19.1 and TurboPack
- **Language**: TypeScript
- **Backend & Database**: Convex
- **Authentication**: Clerk
- **AI**: OpenAI, OpenRouter, Cerebras, ElevenLabs for TTS
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI & shadcn/ui
- **Rate Limiting**: Arcjet

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-repo/chalktalk-studio.git
    cd chalktalk-studio
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**

    Create a `.env.local` file in the root of the project and add the required environment variables.

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Configuration

The following environment variables are required to run the application. You can get them from the respective services.

```
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Convex Backend
NEXT_PUBLIC_CONVEX_URL=

# AI & TTS Services
OPENROUTER_API_KEY=
CEREBRAS_CODE_KEY=
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID= # Optional, has a default

# GrapesJS Studio SDK
NEXT_PUBLIC_GRAPES_SDK_LICENSE_KEY=

# Arcjet Rate Limiting
ARCJET_KEY=
```

## Available Scripts

-   `npm run dev`: Start the development server.
-   `npm run build`: Build the application for production.
-   `npm run start`: Start the production server.
-   `npm run test:e2e`: Run Playwright end-to-end tests.
