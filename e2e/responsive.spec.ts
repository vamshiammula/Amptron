import { expect, test } from '@playwright/test'

test.describe('responsive type', () => {
  test('hero type scales with the viewport instead of matching laptop sizes on a phone', async ({
    page,
  }, testInfo) => {
    await page.goto('/')

    const hero = page.getByRole('heading', { level: 1 })
    await expect(hero).toBeVisible()

    const metrics = await hero.evaluate((el) => {
      const styles = getComputedStyle(el)
      const section = el.closest('.hero')
      const title = document.querySelector('.section-title')
      return {
        fontSize: parseFloat(styles.fontSize),
        titleSize: title ? parseFloat(getComputedStyle(title).fontSize) : 0,
        heroHeight: section?.getBoundingClientRect().height ?? 0,
        viewportHeight: window.innerHeight,
      }
    })

    if (testInfo.project.name === 'mobile-safari') {
      expect(metrics.fontSize).toBeLessThan(32)
      expect(metrics.fontSize).toBeGreaterThan(24)
      expect(metrics.titleSize).toBeLessThan(28)
      expect(metrics.heroHeight).toBeLessThan(metrics.viewportHeight)
    } else {
      expect(metrics.fontSize).toBeGreaterThanOrEqual(48)
      expect(metrics.titleSize).toBeGreaterThanOrEqual(32)
    }
  })
})
