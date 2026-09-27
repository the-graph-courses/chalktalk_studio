import { clerk, clerkSetup } from '@clerk/testing/playwright'
import { test as setup } from '@playwright/test'
import path from 'path'

const authFile = path.join(__dirname, '../playwright/.clerk/user.json')

setup('authenticate', async ({ page }) => {
    await clerkSetup()

    await page.goto('/')
    await clerk.signIn({
        page,
        signInParams: {
            strategy: 'password',
            identifier: process.env.E2E_CLERK_USER_EMAIL!,
            password: process.env.E2E_CLERK_USER_PASSWORD!,
        },
    })
    // Verify we're signed in by checking a protected page
    await page.goto('/decks')
    await page.waitForLoadState('networkidle')
    // Save auth state
    await page.context().storageState({ path: authFile })
})
