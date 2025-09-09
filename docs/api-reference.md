# API Reference

## AI Tools API

### POST /api/ai/tools

Main endpoint for AI-powered slide operations.

**Request Body:**
```typescript
{
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
}
```

**Available Tools:**
- `create_slide`: Create a new slide
- `read_slide`: Read existing slide content
- `replace_slide`: Replace slide content
- `read_deck`: Read entire deck content

### POST /api/chat/ephemeral

Ephemeral chat endpoint for AI assistance.

**Request Body:**
```typescript
{
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  projectId?: string;
}
```

## Slide Tools

### Client-side Tools (`lib/slide-tools.ts`)

```typescript
// Get slide by index
getSlideByIndex(slides: any[], index: number): any

// Create new slide
createSlide(format: SlideFormat, content?: any): any

// Replace slide content
replaceSlide(slides: any[], index: number, newSlide: any): any[]
```

### Server-side Tools (`lib/slide-tools-server.ts`)

```typescript
// Generate slide content using AI
generateSlideContent(prompt: string, format: SlideFormat): Promise<any>

// Process slide templates
processSlideTemplate(template: SlideTemplate, data: any): any
```

## Slide Formats

Available slide formats defined in `lib/slide-formats.ts`:

- `title`: Title slide
- `content`: Content slide with bullet points
- `image`: Image-focused slide
- `quote`: Quote slide
- `comparison`: Side-by-side comparison
- `timeline`: Timeline slide

## Convex Functions

### User Management

```typescript
// Get current user
getCurrentUser(): Promise<User | null>

// Create/update user
createUser(userData: UserData): Promise<Id<"users">>
```

### Slide Deck Management

```typescript
// Create new deck
createDeck(deckData: DeckData): Promise<Id<"slideDecks">>

// Get deck by ID
getDeckById(deckId: Id<"slideDecks">): Promise<SlideDeck | null>

// Update deck
updateDeck(deckId: Id<"slideDecks">, updates: Partial<SlideDeck>): Promise<void>

// Delete deck
deleteDeck(deckId: Id<"slideDecks">): Promise<void>
```
