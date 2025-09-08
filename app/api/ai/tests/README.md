# AI Tools Test Suite

This directory contains organized tests for all AI tools in the ChalkTalk Studio application.

## Test Endpoints

### Individual Tool Tests

- **`/api/ai/tests/chat`** - Test AI chat functionality with full response
- **`/api/ai/tests/read-deck`** - Read entire slide deck with optional names
- **`/api/ai/tests/read-slide`** - Read specific slide by index
- **`/api/ai/tests/generate-slide`** - Create new slide at specified position (-1 for end)
- **`/api/ai/tests/edit-slide`** - Edit existing slide content and name

## Usage

### Default Testing (uses default project ID)

```bash
# Test AI chat functionality with full response
curl -X POST http://localhost:3000/api/ai/tests/chat

# Test reading slide deck
curl -X POST http://localhost:3000/api/ai/tests/read-deck

# Test reading specific slide (reads slide 0 by default)
curl -X POST http://localhost:3000/api/ai/tests/read-slide

# Test creating new slide
curl -X POST http://localhost:3000/api/ai/tests/generate-slide

# Test editing existing slide (edits slide 0 by default)
curl -X POST http://localhost:3000/api/ai/tests/edit-slide
```

### Custom Parameters

```bash
# Test chat with custom message and project ID
curl -X POST http://localhost:3000/api/ai/tests/chat \
  -H "Content-Type: application/json" \
  -d '{"projectId":"your-project-id","message":"Your custom message here"}'

# Test reading deck with all parameters
curl -X POST http://localhost:3000/api/ai/tests/read-deck \
  -H "Content-Type: application/json" \
  -d '{"projectId":"your-project-id","includeNames":true}'

# Test reading specific slide
curl -X POST http://localhost:3000/api/ai/tests/read-slide \
  -H "Content-Type: application/json" \
  -d '{"projectId":"your-project-id","slideIndex":1}'

# Test creating new slide with all parameters
curl -X POST http://localhost:3000/api/ai/tests/generate-slide \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "your-project-id",
    "name": "My Custom Slide",
    "content": "<div style=\"padding: 40px; text-align: center;\"><h1>My Custom Slide</h1><p>Custom content here</p></div>",
    "insertAtIndex": -1
  }'

# Test editing slide with all parameters
curl -X POST http://localhost:3000/api/ai/tests/edit-slide \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "your-project-id",
    "slideIndex": 0,
    "newName": "Updated Slide Name",
    "newContent": "<div style=\"padding: 40px; background: #f0f0f0;\"><h1>Updated Content</h1><p>This slide has been modified</p></div>"
  }'
```

## Default Values

- **Default Project ID**: `project_xemtydcq0f_1757338119773`
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
echo "💬 Testing AI Chat..."
curl -X POST http://localhost:3000/api/ai/tests/chat
echo -e "\n\n📖 Testing Read Deck..."
curl -X POST http://localhost:3000/api/ai/tests/read-deck
echo -e "\n\n📄 Testing Read Slide..."
curl -X POST http://localhost:3000/api/ai/tests/read-slide
echo -e "\n\n➕ Testing New Slide..."
curl -X POST http://localhost:3000/api/ai/tests/generate-slide
echo -e "\n\n✏️ Testing Edit Slide..."
curl -X POST http://localhost:3000/api/ai/tests/edit-slide
echo -e "\n\n✅ All tests completed!"
```

## Core AI Tools

The tests validate these core endpoints:

- **`/api/ai/tools`** - Direct tool execution
- **`/api/ai/chat`** - AI chat with tool integration

## Notes

- All tests use the real project data and make actual changes to the database
- The `edit-slide` and `generate-slide` tests will modify your project
- Tests include automatic retry and error handling
- Chat tests validate streaming responses work correctly
- Run individual tests as needed rather than all at once to better isolate issues
