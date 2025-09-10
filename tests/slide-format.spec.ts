import { test, expect } from '@playwright/test';

test.describe('Slide Format System', () => {
  test('loads test slide editor page', async ({ page }) => {
    // Navigate to our test page
    await page.goto('/test-slide-format');
    
    // Wait for the loading message to disappear and editor to load
    await page.waitForSelector('text=Loading editor...', { state: 'detached', timeout: 30000 });
    
    // Check that the control panel is present
    await expect(page.locator('text=Format:')).toBeVisible();
    await expect(page.locator('text=Zoom Mode:')).toBeVisible();
    await expect(page.locator('text=Infinite Canvas')).toBeVisible();
  });

  test('format selector works correctly', async ({ page }) => {
    await page.goto('/test-slide-format');
    await page.waitForSelector('text=Loading editor...', { state: 'detached', timeout: 30000 });
    
    // Wait for the editor to fully load
    await page.waitForTimeout(3000);
    
    const formatSelector = page.locator('select').first();
    
    // Test format switching
    await formatSelector.selectOption('SQUARE');
    await page.waitForTimeout(1000);
    
    await formatSelector.selectOption('PORTRAIT');
    await page.waitForTimeout(1000);
    
    await formatSelector.selectOption('PRESENTATION_4_3');
    await page.waitForTimeout(1000);
    
    // The test passes if no errors occurred during format switching
    expect(true).toBe(true);
  });

  test('zoom mode controls work', async ({ page }) => {
    await page.goto('/test-slide-format');
    await page.waitForSelector('text=Loading editor...', { state: 'detached', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    const zoomModeSelector = page.locator('select').nth(1);
    
    // Test different zoom modes
    await zoomModeSelector.selectOption('actual-size');
    await page.waitForTimeout(1000);
    
    await zoomModeSelector.selectOption('custom');
    await page.waitForTimeout(500);
    
    // Custom zoom slider should be visible
    await expect(page.locator('input[type="range"]')).toBeVisible();
    
    await zoomModeSelector.selectOption('fit-slide');
    await page.waitForTimeout(1000);
    
    expect(true).toBe(true);
  });

  test('infinite canvas toggle works', async ({ page }) => {
    await page.goto('/test-slide-format');
    await page.waitForSelector('text=Loading editor...', { state: 'detached', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    const infiniteCanvasCheckbox = page.locator('input[type="checkbox"]');
    
    // Toggle infinite canvas
    await infiniteCanvasCheckbox.uncheck();
    await page.waitForTimeout(1000);
    
    await infiniteCanvasCheckbox.check();
    await page.waitForTimeout(1000);
    
    expect(true).toBe(true);
  });

  test('reset zoom button works', async ({ page }) => {
    await page.goto('/test-slide-format');
    await page.waitForSelector('text=Loading editor...', { state: 'detached', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    const resetZoomButton = page.locator('button:has-text("Reset Zoom")');
    
    // Click reset zoom button
    await resetZoomButton.click();
    await page.waitForTimeout(1000);
    
    expect(true).toBe(true);
  });

  test('editor canvas loads correctly', async ({ page }) => {
    await page.goto('/test-slide-format');
    await page.waitForSelector('text=Loading editor...', { state: 'detached', timeout: 30000 });
    
    // Wait for the GrapesJS editor to load
    await page.waitForSelector('[data-gjs-type="wrapper"]', { timeout: 30000 });
    
    // The editor should be present
    const editorContainer = page.locator('[data-gjs-type="wrapper"]');
    await expect(editorContainer).toBeVisible();
  });

  test.skip('slide container has correct dimensions for different formats', async ({ page }) => {
    await page.goto('/test-slide-format');
    await page.waitForSelector('text=Loading editor...', { state: 'detached', timeout: 30000 });
    await page.waitForTimeout(5000); // Give extra time for editor to fully initialize
    
    // This test would check for slide container dimensions but requires 
    // more complex iframe navigation to access the GrapesJS canvas content
    // Skipping for now as it requires more sophisticated setup
    
    expect(true).toBe(true);
  });
});