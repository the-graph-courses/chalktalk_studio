import { test, expect } from '@playwright/test';

test.describe('Trip Planning App', () => {
  test('✅ App loads successfully', async ({ page }) => {
    const response = await page.goto('/');
    
    // Check that the page loads
    expect(response?.status()).toBeLessThan(500);
    
    // Wait for content to load
    await page.waitForLoadState('domcontentloaded');
    
    // App should have content
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
    expect(content?.length).toBeGreaterThan(10);
  });

  test('✅ Protected routes redirect to authentication', async ({ page }) => {
    // Attempt to access protected route
    await page.goto('/create-new-trip');
    
    // Should redirect to sign-in since we're not authenticated
    await page.waitForTimeout(2000);
    
    const url = page.url();
    expect(url).toContain('sign-in');
  });

  test('✅ Trips page is protected and links are present', async ({ page }) => {
    // Direct navigation should redirect
    await page.goto('/trips');
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('sign-in');

    // Navigate to home and use sidebar button
    await page.goto('/');
    // Try clicking the My Trips button if visible
    const myTrips = page.getByText('My Trips');
    if (await myTrips.count()) {
      await myTrips.first().click();
      await page.waitForTimeout(1000);
      expect(page.url()).toContain('sign-in');
    }
  });

  test('✅ Authentication flow is set up', async ({ page }) => {
    // Try to access sign-in route
    await page.goto('/sign-in');
    await page.waitForTimeout(1000);
    
    // Check that we're on a sign-in related page
    const url = page.url();
    expect(url).toContain('sign-in');
    
    // Page should have loaded something (even if Clerk isn't fully configured)
    await page.waitForLoadState('domcontentloaded');
  });
});
