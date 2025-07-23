import { Page } from '@playwright/test'

export async function goToStopServiceWorker(page: Page) {
  await page.goto(`chrome://serviceworker-internals/`)
  await page.getByRole('button', { name: 'Stop' }).click()
}

export function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

/**
 * Sign in but expecting the target page attached signInWithTestCredential in window
 */
export async function signIn(page: Page) {
  await page.evaluate(async () => {
    //@ts-expect-error Exposed method
    await window.signInWithTestCredential()
  })
}

/**
 * Enable sign in feature flag but expecting the target page attached featureFlagsService in window
 */
export async function enableSignInFeatureFlag(page: Page) {
  await page.evaluate(async () => {
    //@ts-expect-error Exposed method
    await window.featureFlagsService.enable('sign-in')
  })
}
