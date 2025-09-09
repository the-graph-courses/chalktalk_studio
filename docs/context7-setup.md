# Context7 MCP Setup Guide

Context7 MCP (Model Context Protocol) allows AI assistants to access up-to-date documentation for better code assistance.

## What is Context7 MCP?

Context7 MCP is a protocol that enables AI assistants to fetch real-time documentation and code examples, ensuring responses are based on the latest information rather than potentially outdated training data.

## Installation

Context7 MCP is already installed in this project as a dev dependency. If you need to install it globally:

```bash
npm install -g @upstash/context7-mcp
```

## Configuration

### For Cursor IDE

The project includes a local Cursor MCP configuration at `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

For global Cursor configuration, add this to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

### For VS Code

Add to your VS Code MCP settings:

```json
{
  "servers": {
    "Context7": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

### For Windsurf

Add to your Windsurf MCP configuration:

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

## Usage

To use Context7 in your prompts with AI assistants, append `use context7` to your questions:

### Examples

```
How do I create a new slide template in ChalkTalk Studio? use context7
```

```
What's the latest way to handle authentication in Next.js 15? use context7
```

```
How do I implement the new React 19 features in this project? use context7
```

```
Show me how to use Convex functions for slide management? use context7
```

## Benefits

1. **Up-to-date Information**: Get responses based on the latest documentation
2. **Version-specific**: Ensures compatibility with your project's dependencies
3. **Accurate Code Examples**: Reduces outdated or incorrect code suggestions
4. **Framework-aware**: Understands your specific tech stack and versions

## Troubleshooting

### Context7 Not Working

1. Ensure the MCP configuration file is in the correct location
2. Restart your IDE after adding the configuration
3. Check that Node.js version 18+ is installed
4. Verify the package is installed: `npm list @upstash/context7-mcp`

### Performance Issues

Context7 fetches documentation in real-time, which may add a slight delay to responses. This is normal and ensures accuracy.

## Project-Specific Context

When using Context7 with this ChalkTalk Studio project, you can ask about:

- Next.js 15.5 specific features
- React 19.1 components and hooks
- Convex database operations
- Clerk authentication patterns
- Tailwind CSS v4 styling
- TypeScript strict mode configurations
- AI SDK integrations
