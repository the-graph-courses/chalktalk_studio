export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId = 'project_pezn9p05voi_1757116077136' } = body;

    const baseUrl = process.env.NEXTJS_URL || 'http://localhost:3000';
    const results: any[] = [];

    // Test 1: Read deck
    try {
      const readDeckResponse = await fetch(`${baseUrl}/api/ai/tests/read-deck`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      results.push(await readDeckResponse.json());
    } catch (error) {
      results.push({ test: 'read_deck', success: false, error: 'Test failed to run' });
    }

    // Test 2: Read slide
    try {
      const readSlideResponse = await fetch(`${baseUrl}/api/ai/tests/read-slide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, slideIndex: 0 }),
      });
      results.push(await readSlideResponse.json());
    } catch (error) {
      results.push({ test: 'read_slide', success: false, error: 'Test failed to run' });
    }

    // Test 3: Generate slide
    try {
      const generateSlideResponse = await fetch(`${baseUrl}/api/ai/tests/generate-slide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, name: 'Test Suite Generated Slide' }),
      });
      results.push(await generateSlideResponse.json());
    } catch (error) {
      results.push({ test: 'generate_slide', success: false, error: 'Test failed to run' });
    }

    // Test 4: Edit slide (edit the first slide)
    try {
      const editSlideResponse = await fetch(`${baseUrl}/api/ai/tests/edit-slide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          projectId, 
          slideIndex: 0,
          newName: 'Test Suite Edited Slide',
          newContent: '<div style="padding: 40px; background: linear-gradient(45deg, #2196F3, #21CBF3); color: white; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;"><h1 style="font-size: 52px; margin-bottom: 20px; text-align: center;">🧪 Test Suite</h1><p style="font-size: 26px; text-align: center; opacity: 0.9;">All AI tools are working correctly!</p><div style="margin-top: 30px; display: flex; gap: 15px; justify-content: center;"><div style="padding: 12px 20px; background: rgba(255,255,255,0.25); border-radius: 15px;"><span>✅ Read</span></div><div style="padding: 12px 20px; background: rgba(255,255,255,0.25); border-radius: 15px;"><span>✅ Generate</span></div><div style="padding: 12px 20px; background: rgba(255,255,255,0.25); border-radius: 15px;"><span>✅ Edit</span></div></div></div>'
        }),
      });
      results.push(await editSlideResponse.json());
    } catch (error) {
      results.push({ test: 'edit_slide', success: false, error: 'Test failed to run' });
    }

    // Test 5: Chat (basic test)
    try {
      const chatResponse = await fetch(`${baseUrl}/api/ai/tests/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          projectId, 
          message: 'Hello! Can you confirm the AI tools are working?' 
        }),
      });
      results.push(await chatResponse.json());
    } catch (error) {
      results.push({ test: 'chat', success: false, error: 'Test failed to run' });
    }

    // Calculate summary
    const totalTests = results.length;
    const passedTests = results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;

    return Response.json({
      test: 'all_tools',
      projectId,
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        success: failedTests === 0,
      },
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('All tools test error:', error);
    return Response.json({
      test: 'all_tools',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
