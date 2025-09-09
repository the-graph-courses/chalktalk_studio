# AI Tools Test Suite

This directory contains organized tests for all AI tools in the ChalkTalk Studio application.

## Test Endpoints

### Individual Tool Tests

- **`/api/ai/tests/read-deck`** - Read entire slide deck with optional names
- **`/api/ai/tests/read-slide`** - Read specific slide by index
- **`/api/ai/tests/create-slide`** - Create new empty slide at specified position (-1 for end)
- **`/api/ai/tests/replace-slide`** - Replace existing slide content and name

## Usage

### Default Testing (uses default project ID)

```bash
# Test reading slide deck
curl -X POST http://localhost:3000/api/ai/tests/read-deck

# Test reading specific slide (reads slide 0 by default)
curl -X POST http://localhost:3000/api/ai/tests/read-slide

# Test creating new slide
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

# Test creating new slide with all parameters
curl -X POST http://localhost:3000/api/ai/tests/create-slide \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "your-project-id",
    "name": "My Custom Slide",
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
    "newContent": "<div style=\"padding: 40px; background: #f0f0f0;\"><h1>Updated Content</h1><p>This slide has been modified</p></div>"
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

## Core AI Tools

The tests validate these core endpoints:

- **`/api/ai/tools`** - Direct tool execution

## Notes

- All tests use the real project data and make actual changes to the database
- The `replace-slide` and `create-slide` tests will modify your project
- Tests include automatic retry and error handling
- Run individual tests as needed rather than all at once to better isolate issues
