# AI Tools Test Suite

This directory contains organized tests for all AI tools in the ChalkTalk Studio application.

## Test Endpoints

### Individual Tool Tests

- **`/api/ai/tests/read-deck`** - Read entire slide deck with optional names
- **`/api/ai/tests/read-slide`** - Read specific slide by index
- **`/api/ai/tests/create-slide`** - Create new slide with rich content at specified position (-1 for end)
- **`/api/ai/tests/replace-slide`** - Replace existing slide content and name

## Usage

### Default Testing (uses default project ID)

```bash
# Test reading slide deck
curl -X POST http://localhost:3000/api/ai/tests/read-deck

# Test reading specific slide (reads slide 0 by default)
curl -X POST http://localhost:3000/api/ai/tests/read-slide

# Test creating new slide with rich content
curl -X POST http://localhost:3000/api/ai/tests/create-slide

# Test replacing existing slide (replaces slide 0 by default)
curl -X POST http://localhost:3000/api/ai/tests/replace-slide
```

### Custom Parameters

```bash
# Test reading deck with all parameters
curl -X POST http://localhost:3000/api/ai/tests/read-deck \
  -H "Content-Type: application/json" \
  -d '{"projectId":"your-project-id","includeNames":true}'

# Test reading specific slide
curl -X POST http://localhost:3000/api/ai/tests/read-slide \
  -H "Content-Type: application/json" \
  -d '{"projectId":"your-project-id","slideIndex":1}'

# Test creating new slide with custom content
curl -X POST http://localhost:3000/api/ai/tests/create-slide \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "your-project-id",
    "name": "My Custom Slide",
    "content": "<div style=\"padding: 40px; background: #f8f9fa; border-radius: 8px;\"><h2>Custom Content</h2><p>This slide was created with custom HTML content!</p></div>",
    "insertAtIndex": -1
  }'

# Test creating empty slide (legacy approach)
curl -X POST http://localhost:3000/api/ai/tests/create-slide \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "your-project-id",
    "name": "Empty Slide",
    "content": "",
    "insertAtIndex": -1
  }'

# Test replacing slide with all parameters
curl -X POST http://localhost:3000/api/ai/tests/replace-slide \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "your-project-id",
    "slideIndex": 0,
    "newName": "Updated Slide Name",
    "newContent": "<div style=\"padding: 40px; background: #f0f0f0;\"><h2>Updated Content</h2><p>This slide has been modified</p></div>"
  }'
```

## Default Values

- **Default Project ID**: `project_5ixc4na0jc4_1757422475707`
- **Default Slide Index**: `0`
- **Default Include Names**: `true`

## Test Results Format

All tests return a consistent format:

```json
{
  "test": "test_name",
  "projectId": "project_id",
  "success": true|false,
  "result": {...},
  "timestamp": "2025-09-06T15:31:35.094Z",
  // ... additional test-specific fields
}
```

## Running Multiple Tests

To run all tests in sequence, you can use this simple bash script:

```bash
#!/bin/bash
echo "📖 Testing Read Deck..."
curl -X POST http://localhost:3000/api/ai/tests/read-deck
echo -e "\n\n📄 Testing Read Slide..."
curl -X POST http://localhost:3000/api/ai/tests/read-slide
echo -e "\n\n➕ Testing Create Slide..."
curl -X POST http://localhost:3000/api/ai/tests/create-slide
echo -e "\n\n✏️ Testing Replace Slide..."
curl -X POST http://localhost:3000/api/ai/tests/replace-slide
echo -e "\n\n✅ All tests completed!"
```

## AI Tool Capabilities

The AI chat system can perform these operations:

### Content Creation Strategy

**✅ Recommended Approach**: Create slides with content directly
- More efficient (single API call)
- Better user experience (immediate results)
- Atomic operations (less error-prone)

**⚠️ Legacy Approach**: Create empty slide → Replace content
- Use only when incremental content building is needed
- Two-step process with potential race conditions

### Core Endpoints

- **`/api/ai/tools`** - Direct tool execution for AI chat
- **`/api/ai/tests/*`** - Individual tool testing endpoints

## Notes

- All tests use the real project data and make actual changes to the database
- The `replace-slide` and `create-slide` tests will modify your project
- Tests include automatic retry and error handling
- Run individual tests as needed rather than all at once to better isolate issues
- **New**: `create-slide` now demonstrates creating slides with rich content by default
- The AI can create complete, styled slides in a single operation

## Content Creation Best Practices

### For AI Chat Integration:
1. **Create with content**: Use the `createSlide` tool with rich HTML content
2. **Use absolute positioning**: Ensures proper layout control in the editor
3. **Include inline styles**: All styling should be embedded in the HTML
4. **Provide semantic structure**: Use proper heading hierarchy and meaningful content
5. **Heading Hierarchy**: Use h1 for title-only slides, h2 for slides with additional content

### Example Rich Content Structure:
```html
<div data-slide-container="true" style="position: absolute; top: 0; left: 0; width: 1280px; height: 720px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px; overflow: visible;">
  <h2 style="position: absolute; top: 50px; left: 50px; font-size: 48px; font-weight: 700;">Title</h2>
  <p style="position: absolute; top: 130px; left: 50px; font-size: 22px; max-width: 550px;">Content goes here...</p>
  <!-- Additional positioned elements -->
</div>
<style>
  body {
    margin: 0;
    padding: 0;
    position: relative;
    width: 1280px;
    min-height: 720px;
    background: #f3f4f6;
    overflow: hidden;
  }
</style>
```
