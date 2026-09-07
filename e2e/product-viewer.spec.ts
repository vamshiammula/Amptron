import { expect, test } from '@playwright/test'

// Minimal geometry tests the real GLB renderer; never shown as scooter imagery.
function triangleGlb() {
  const positions = Buffer.alloc(36)
  ;[-1, -1, 0, 1, -1, 0, 0, 1, 0].forEach((value, index) =>
    positions.writeFloatLE(value, index * 4),
  )
  const json = JSON.stringify({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, material: 0 }] }],
    materials: [{ doubleSided: true }],
    buffers: [{ byteLength: 36 }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 36 }],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 3,
        type: 'VEC3',
        min: [-1, -1, 0],
        max: [1, 1, 0],
      },
    ],
  })
  const body = Buffer.from(
    json.padEnd(Math.ceil(Buffer.byteLength(json) / 4) * 4, ' '),
  )
  const header = Buffer.alloc(20)
  header.writeUInt32LE(0x46546c67, 0)
  header.writeUInt32LE(2, 4)
  header.writeUInt32LE(28 + body.length + positions.length, 8)
  header.writeUInt32LE(body.length, 12)
  header.writeUInt32LE(0x4e4f534a, 16)
  const bin = Buffer.alloc(8)
  bin.writeUInt32LE(positions.length, 0)
  bin.writeUInt32LE(0x004e4942, 4)
  return Buffer.concat([header, body, bin, positions])
}

test('empty media slots stay branded without old product images or videos', async ({
  page,
}) => {
  const retiredRequests: string[] = []
  page.on('request', (request) => {
    if (
      /\/products\/amptron-storm\/|hero-showcase|hero-scooter|technical-cutaway/.test(
        request.url(),
      )
    )
      retiredRequests.push(request.url())
  })
  for (const slug of ['amptron-cruise']) {
    await page.goto(`/models/${slug}`)
    await expect(page.locator('.scooter-stage')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Zoom in' })).toBeDisabled()
    await expect(page.locator('main img, main video')).toHaveCount(0)
  }
  expect(retiredRequests).toEqual([])
})

test('NIRA product page uses the 3D studio and named stills', async ({ page }) => {
  await page.goto('/models/amptron-nira')
  await expect(page.getByRole('heading', { level: 1, name: 'Amptron NIRA' })).toBeVisible()
  await expect(page.getByText('Starting at')).toBeVisible()
  await expect(page.getByText('Pearl Ivory · Sage Green · Matte Grey · Midnight Black')).toBeVisible()
  await expect(page.getByRole('button', { name: '3D view' })).toBeVisible()
  await expect(page.locator('img[src*="amptron-nira-pearl-ivory"]')).toHaveCount(6)
  await page.goto('/models/amptron-storm')
  await expect(page).toHaveURL(/\/models\/amptron-nira$/)
})

test('a newly added model deep link loads its GLB and enables rotation/zoom controls', async ({
  page,
}) => {
  await page.route('**/rest/v1/blog_posts?*', (route) =>
    route.fulfill({ json: [] }),
  )
  await page.route('**/rest/v1/scooter_models?*', (route) =>
    route.fulfill({
      json: [
        {
          slug: 'amptron-studio-test',
          name: 'Amptron Studio Test',
          tagline: 'Test fixture',
          description: 'Renderer integration fixture',
          image_url: '',
          video_url: '',
          model_3d_url: '/test-model.glb',
          media_ready: true,
          published: true,
          featured: false,
          highlights: [{ label: 'Range', value: '80 km', note: '' }],
          specs: [],
          features: [],
        },
      ],
    }),
  )
  await page.route('**/test-model.glb', (route) =>
    route.fulfill({ contentType: 'model/gltf-binary', body: triangleGlb() }),
  )
  await page.goto('/models/amptron-studio-test')
  await expect(
    page.getByRole('heading', { name: 'Amptron Studio Test', level: 1 }),
  ).toBeVisible()
  await expect(page.locator('model-viewer')).toHaveAttribute('camera-controls', '')
  await expect(page.getByRole('button', { name: 'Zoom in' })).toBeEnabled({
    timeout: 20000,
  })
  await page.getByRole('button', { name: 'Zoom in' }).click()
  await page.getByRole('button', { name: 'Reset 3D view' }).click()
  await expect(page.locator('.stage-help')).toContainText('Drag to rotate')
})

test('a missing GLB gives recovery without breaking model specifications', async ({
  page,
}) => {
  await page.route('**/rest/v1/blog_posts?*', (route) =>
    route.fulfill({ json: [] }),
  )
  await page.route('**/rest/v1/scooter_models?*', (route) =>
    route.fulfill({
      json: [
        {
          slug: 'amptron-studio-test',
          name: 'Amptron Studio Test',
          tagline: 'Test fixture',
          description: 'Test fixture',
          image_url: '',
          model_3d_url: '/missing.glb',
          media_ready: true,
          featured: false,
          highlights: [],
          specs: [],
          features: [],
        },
      ],
    }),
  )
  await page.route('**/missing.glb', (route) =>
    route.fulfill({ status: 404, body: 'Not found' }),
  )
  await page.goto('/models/amptron-studio-test')
  await expect(page.getByRole('alert')).toContainText('could not load', {
    timeout: 20000,
  })
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible()
  await expect(page.locator('#specs')).toBeAttached()
})
