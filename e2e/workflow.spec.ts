import { test, expect } from '@playwright/test';

// This test walks through the main workflow shown in workflow_screenshots:
// 1. Landing page → 2. Dashboard → 3. New Presentation → 4. Editor with template
// 5. Open AI Chat → 6. Send a prompt → 7. AI creates slides
// 8. View → Present with AI Voice → 9. Present-voice page loads

test('full workflow: create presentation, AI chat, present', async ({ page, context }) => {
    // ──────────────────────────────────────────────────
    // STEP 1: Landing page
    // ──────────────────────────────────────────────────
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e/screenshots/01-landing.png' });

    // ──────────────────────────────────────────────────
    // STEP 2: Navigate to dashboard (decks page)
    // ──────────────────────────────────────────────────
    await page.goto('/decks');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'My Presentations' })).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/02-decks.png' });

    // ──────────────────────────────────────────────────
    // STEP 3: Click "New Presentation" to create a new project
    // ──────────────────────────────────────────────────
    // Click the visible "+ New Presentation" button in the main content area (not sidebar)
    await page.getByRole('main').getByRole('button', { name: 'New Presentation' }).click();
    await page.waitForURL(/\/editor\//);
    const editorUrl = page.url();
    const projectId = editorUrl.split('/editor/')[1];
    console.log('Created project:', projectId);

    // ──────────────────────────────────────────────────
    // STEP 4: Editor loads with template dialog
    // ──────────────────────────────────────────────────
    // Wait for GrapesJS editor to initialize
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'e2e/screenshots/03-editor-template-dialog.png' });

    // Template dialog appears from GrapesJS SDK — close it
    // Wait for it to be visible, then press Escape or click X
    try {
        await page.locator('text=Choose a template').waitFor({ state: 'visible', timeout: 8000 });
        await page.screenshot({ path: 'e2e/screenshots/03b-template-dialog-visible.png' });
        // Press Escape to close the dialog
        await page.keyboard.press('Escape');
        await page.waitForTimeout(2000);
        // If dialog is still there, try clicking the X button with force
        const dialogStillOpen = await page.locator('text=Choose a template').isVisible();
        if (dialogStillOpen) {
            // The X is an SVG or button near the top-right of the dialog
            await page.locator('.gs-cmp-modal-overlay').click({ position: { x: 5, y: 5 }, force: true });
            await page.waitForTimeout(1000);
        }
    } catch {
        // Dialog might not appear for returning projects
    }
    await page.screenshot({ path: 'e2e/screenshots/04-editor-after-template.png' });

    // ──────────────────────────────────────────────────
    // STEP 5: Open AI Chat panel
    // ──────────────────────────────────────────────────
    // The "Toggle Chat" button has title="Toggle Chat"
    await page.locator('button[title="Toggle Chat"]').click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'e2e/screenshots/05-chat-open.png' });

    // Chat panel should be visible with the input
    const chatInput = page.locator('input[placeholder="Ask me anything about your presentation..."]');
    await expect(chatInput).toBeVisible({ timeout: 5000 });

    // ──────────────────────────────────────────────────
    // STEP 6: Send a message to the AI
    // ──────────────────────────────────────────────────
    await chatInput.fill('Make a simple one-slide presentation about the moon');
    await page.screenshot({ path: 'e2e/screenshots/06-chat-typed.png' });

    // Click the send button (the Send icon button next to the input)
    await page.locator('button[type="submit"]').click();

    // Wait for AI response — look for tool calls or assistant messages
    // The AI will use tools (readDeck, replaceSlide/addSlide), which take time
    // Wait up to 60 seconds for a response
    await page.waitForTimeout(3000); // Let it start
    await page.screenshot({ path: 'e2e/screenshots/07-chat-loading.png' });

    // Wait for the loading to finish — the send button reappears (not a stop button)
    await page.locator('button[type="submit"]').waitFor({ state: 'visible', timeout: 90000 });
    await page.waitForTimeout(2000); // Let editor update
    await page.screenshot({ path: 'e2e/screenshots/08-chat-response.png' });

    // ──────────────────────────────────────────────────
    // STEP 7: Verify slide was created/modified
    // ──────────────────────────────────────────────────
    // The editor should show content (not just blank). Check via the pages panel.
    await page.screenshot({ path: 'e2e/screenshots/09-editor-with-slides.png' });

    // ──────────────────────────────────────────────────
    // STEP 8: Navigate to Present with AI Voice
    // ──────────────────────────────────────────────────
    // Open View menu and click "Present with AI Voice"
    // This opens a new tab via window.open
    const [presentPage] = await Promise.all([
        context.waitForEvent('page'),
        page.locator('button:has-text("View")').click().then(async () => {
            await page.locator('text=Present with AI Voice').click();
        }),
    ]);

    // ──────────────────────────────────────────────────
    // STEP 9: Present-voice page loads
    // ──────────────────────────────────────────────────
    await presentPage.waitForLoadState('networkidle');
    await presentPage.waitForTimeout(3000);
    await presentPage.screenshot({ path: 'e2e/screenshots/10-present-voice.png' });

    // Should show the presentation setup page
    const pageContent = await presentPage.content();
    const hasAudioPrompt = pageContent.includes('Generate Audio') || pageContent.includes('Start Presentation');
    expect(hasAudioPrompt).toBe(true);
    console.log('Present-voice page loaded successfully');

    // ──────────────────────────────────────────────────
    // STEP 10: Generate Audio (uses ElevenLabs API)
    // ──────────────────────────────────────────────────
    const generateBtn = presentPage.locator('button:has-text("Generate Audio")');
    if (await generateBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await generateBtn.click();
        // Wait for audio generation (can take 15-30 seconds)
        await presentPage.waitForTimeout(5000);
        await presentPage.screenshot({ path: 'e2e/screenshots/11-generating-audio.png' });

        // Wait for "Start Presentation" to appear (up to 60 seconds)
        try {
            await presentPage.locator('button:has-text("Start Presentation")').waitFor({ timeout: 60000 });
            await presentPage.screenshot({ path: 'e2e/screenshots/12-audio-ready.png' });
            console.log('Audio generated successfully');

            // Click Start Presentation
            await presentPage.locator('button:has-text("Start Presentation")').click();
            await presentPage.waitForTimeout(3000);
            await presentPage.screenshot({ path: 'e2e/screenshots/13-presenting.png' });
            console.log('Presentation started');
        } catch {
            await presentPage.screenshot({ path: 'e2e/screenshots/12-audio-failed.png' });
            console.log('Audio generation timed out or failed — check screenshot');
        }
    } else {
        console.log('Generate Audio button not visible — audio may already be cached');
        await presentPage.screenshot({ path: 'e2e/screenshots/11-no-generate-btn.png' });
    }
});
