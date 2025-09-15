# Context7 MCP Setup Guide

Context7 MCP (Model Context Protocol) is already installed in this ChalkTalk Studio application and provides enhanced AI assistance by accessing up-to-date documentation and context.

## Installation Status

✅ Context7 MCP is installed as a dev dependency: `@upstash/context7-mcp@^1.0.17`

## Configuration

### MCP Server Configuration

Create a `mcp.json` file in your project root to configure the Context7 MCP server:

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

### Alternative Configurations

If you encounter issues with `npx` (e.g., `spawn npx ENOENT`), try these alternatives:

#### Using bunx
```json
{
  "mcpServers": {
    "context7": {
      "command": "bunx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

#### Using deno
```json
{
  "mcpServers": {
    "context7": {
      "command": "deno",
      "args": ["run", "--allow-env=NO_DEPRECATION,TRACE_DEPRECATION", "--allow-net", "npm:@upstash/context7-mcp"]
    }
  }
}
```

## Usage

### In AI Conversations

To access up-to-date documentation and context, simply append `use context7` to your prompts when working with AI assistants.

**Example:**
```
How do I implement authentication in this Next.js app? use context7
```

### CLI Usage

You can also run Context7 MCP directly from the command line:

```bash
# Run with stdio transport (default)
npx context7-mcp

# Run with HTTP transport on port 3000
npx context7-mcp --transport http --port 3000

# Run with API key authentication
npx context7-mcp --api-key your-api-key
```

## Available Options

- `--transport <stdio|http>`: Transport type (default: "stdio")
- `--port <number>`: Port for HTTP transport (default: "3000")
- `--api-key <key>`: API key for authentication
- `-h, --help`: Display help for command

## Troubleshooting

### Common Issues

1. **`spawn npx ENOENT` Error**
   - This occurs when the application can't find the `npx` executable
   - Solution: Use alternative configurations with `bunx` or `deno` as shown above
   - For Linux/NVM users: Ensure your shell configuration properly sets up environment variables

2. **Node.js Version**
   - Context7 MCP requires Node.js 18 or later
   - Check your version: `node --version`

3. **Package Not Found**
   - Ensure the package is installed: `npm list @upstash/context7-mcp`
   - Reinstall if needed: `npm install --save-dev @upstash/context7-mcp`

### Verification

To verify Context7 MCP is working correctly:

1. Check if the package is installed:
   ```bash
   npm list @upstash/context7-mcp
   ```

2. Test the CLI:
   ```bash
   npx context7-mcp --help
   ```

3. In AI conversations, try using `use context7` in your prompts and verify that the assistant can access current project documentation.

## Integration with ChalkTalk Studio

Context7 MCP enhances the AI capabilities in ChalkTalk Studio by providing:

- Access to up-to-date Next.js 15.5 documentation
- Current React 19.1 patterns and best practices
- Real-time Convex backend integration guidance
- Tailwind CSS v4 styling recommendations
- TypeScript strict mode configurations

This ensures that AI assistants working on your ChalkTalk Studio project have access to the most current and relevant information for your tech stack.

## Resources

- [Context7 MCP NPM Package](https://www.npmjs.com/package/@upstash/context7-mcp)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [Upstash Documentation](https://upstash.com/)
