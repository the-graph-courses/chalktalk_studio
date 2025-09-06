# AI Tools Test Suite

This directory contains organized tests for all AI tools in the ChalkTalk Studio application.

## Test Endpoints

### Individual Tool Tests

- **`/api/ai/tests/read-slide`** - Test reading a specific slide
- **`/api/ai/tests/read-deck`** - Test reading an entire slide deck
- **`/api/ai/tests/generate-slide`** - Test generating a new slide
- **`/api/ai/tests/edit-slide`** - Test editing an existing slide
- **`/api/ai/tests/chat`** - Test the AI chat functionality

### Comprehensive Test

- **`/api/ai/tests/all`** - Run all tests in sequence and get a summary

## Usage

### Default Testing (uses default project ID)
```bash
# Test individual tools
curl -X POST http://localhost:3000/api/ai/tests/read-deck
curl -X POST http://localhost:3000/api/ai/tests/read-slide
curl -X POST http://localhost:3000/api/ai/tests/generate-slide
curl -X POST http://localhost:3000/api/ai/tests/edit-slide
curl -X POST http://localhost:3000/api/ai/tests/chat

# Run all tests
curl -X POST http://localhost:3000/api/ai/tests/all
```

### Custom Parameters
```bash
# Test with specific project ID
curl -X POST http://localhost:3000/api/ai/tests/read-deck \
  -H "Content-Type: application/json" \
  -d '{"projectId":"your-project-id"}'

# Test reading specific slide
curl -X POST http://localhost:3000/api/ai/tests/read-slide \
  -H "Content-Type: application/json" \
  -d '{"projectId":"your-project-id","slideIndex":1}'

# Test generating slide with custom content
curl -X POST http://localhost:3000/api/ai/tests/generate-slide \
  -H "Content-Type: application/json" \
  -d '{"projectId":"your-project-id","name":"My Custom Slide","content":"<div>Custom HTML</div>"}'

# Test editing slide with custom content
curl -X POST http://localhost:3000/api/ai/tests/edit-slide \
  -H "Content-Type: application/json" \
  -d '{"projectId":"your-project-id","slideIndex":0,"newName":"Updated Slide","newContent":"<div>New content</div>"}'
```

## Default Values

- **Default Project ID**: `project_pezn9p05voi_1757116077136`
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

## Comprehensive Test Summary

The `/all` endpoint provides a summary:
```json
{
  "test": "all_tools",
  "projectId": "project_id",
  "summary": {
    "total": 5,
    "passed": 5,
    "failed": 0,
    "success": true
  },
  "results": [...],
  "timestamp": "2025-09-06T15:31:45.821Z"
}
```

## Core AI Tools

The tests validate these core endpoints:
- **`/api/ai/tools`** - Direct tool execution
- **`/api/ai/chat`** - AI chat with tool integration
- **`/api/ai/test`** - Basic AI connection test

## Notes

- All tests use the real project data and make actual changes to the database
- The `edit-slide` and `generate-slide` tests will modify your project
- Tests include automatic retry and error handling
- Chat tests validate streaming responses work correctly
