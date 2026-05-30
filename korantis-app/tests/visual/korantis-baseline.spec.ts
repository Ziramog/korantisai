import { expect, Page, test } from '@playwright/test';

const snapshotOptions = {
  animations: 'disabled' as const,
  fullPage: true,
  maxDiffPixelRatio: 0.01,
};

const mockVenues = [
  {
    id: 'floreria',
    name: 'Floreria Atlantico',
    category: 'Speakeasy Bar',
    location: 'Retiro',
    cardSize: 'immersive',
    spacing: 'breathe',
    heroImage: '/venue_floreria.png',
    atmosphere: 'late-night',
    quality: 0.95,
    tagline: 'Hidden beneath the surface, where nights feel like cinema.',
    narrative: 'A subterranean warmth shaped by amber light, slow jazz, and conversations that naturally drift past midnight.',
    tags: ['Hidden', 'Atmospheric', 'Late Night'],
    tasteVector: [-0.9, 0.5, 0.9, -0.9, -0.8, -0.6, 0.4, 0.7],
    lat: -34.5907,
    lng: -58.3789,
  },
  {
    id: 'crisol',
    name: 'Crisol Cafe',
    category: 'Coffee & Bakery',
    location: 'Villa Crespo',
    cardSize: 'compact',
    spacing: 'tight',
    heroImage: '/venue_crisol.png',
    atmosphere: 'morning',
    quality: 0.8,
    tagline: 'Nordic clarity meets Japanese restraint in a quiet morning ritual.',
    narrative: 'Pale ash wood, a single ceramic pour-over, and sunlight that makes you forget the city outside.',
    tags: ['Quiet', 'Minimal', 'Morning'],
    tasteVector: [0.7, -0.2, -0.4, 0.8, 0.7, -0.2, -0.6, -0.4],
    lat: -34.5996,
    lng: -58.4379,
  },
  {
    id: 'invernadero',
    name: 'Invernadero',
    category: 'Gin & Tapas',
    location: 'Palermo Botanico',
    cardSize: 'layered',
    spacing: 'breathe',
    heroImage: '/venue_invernadero.png',
    atmosphere: 'afternoon',
    quality: 0.88,
    tagline: 'Dining inside a living greenhouse, where nature sets the table.',
    narrative: 'Glass ceilings filter the afternoon sun through a canopy of ferns and tropical palms.',
    tags: ['Greenhouse', 'Daylight', 'Afternoon'],
    tasteVector: [0.2, 0.1, 0.1, 0.5, 0.2, 0.4, 0.1, 0.1],
    lat: -34.5847,
    lng: -58.4002,
  },
  {
    id: 'ninina',
    name: 'Ninina',
    category: 'Bakery & Cafe',
    location: 'Palermo Soho',
    cardSize: 'cinematic',
    spacing: 'isolated',
    heroImage: '/venue_ninina.png',
    atmosphere: 'golden-hour',
    quality: 0.85,
    tagline: 'Golden warmth and the hum of slow evenings.',
    narrative: 'The late afternoon sun paints everything in amber.',
    tags: ['Golden Hour', 'Slow Hum', 'Evening'],
    tasteVector: [0, 0.6, 0.5, 0.2, -0.3, 0.6, 0.3, 0.3],
    lat: -34.5886,
    lng: -58.4312,
  },
];

const mockAdminVenues = mockVenues.map((venue, index) => ({
  id: venue.id,
  name: venue.name,
  city: 'Buenos Aires',
  status: index === 0 ? 'ready_for_review' : 'published',
  tags: venue.tags,
  resonance: {
    score: 0.82 - index * 0.07,
    label: index === 0 ? 'strong' : 'partial',
  },
  completeness_score: 0.75 + index * 0.05,
  review_count: 12 + index,
}));

async function installBaselineMocks(page: Page) {
  await page.addInitScript(() => {
    const fixedNow = new Date('2026-05-30T18:00:00-03:00').valueOf();
    Date.now = () => fixedNow;
  });

  await page.route('**/api/venues', async (route) => {
    await route.fulfill({ json: { venues: mockVenues } });
  });

  await page.route('**/api/admin/venues', async (route) => {
    await route.fulfill({ json: { venues: mockAdminVenues } });
  });

  await page.route('**/api/admin/venues/*', async (route) => {
    const id = route.request().url().split('/').pop() ?? 'floreria';
    const venue = mockVenues.find((item) => item.id === id) ?? mockVenues[0];
    await route.fulfill({
      json: {
        venue,
        rawReviews: [
          { text: 'Warm, atmospheric, and memorable.', rating: 5, language: 'en' },
          { text: 'A quiet cinematic room with precise service.', rating: 4, language: 'en' },
        ],
        quality: {
          completenessScore: 0.86,
          readyForReview: true,
        },
      },
    });
  });

  await page.route('**/auth/v1/**', async (route) => {
    await route.fulfill({ json: {} });
  });
}

async function openHome(page: Page) {
  await installBaselineMocks(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('Floreria Atlantico')).toBeVisible();
}

test.describe('Korantis visual baseline', () => {
  test('home', async ({ page }) => {
    await openHome(page);
    await expect(page).toHaveScreenshot('home.png', snapshotOptions);
  });

  test('search feed', async ({ page }) => {
    await openHome(page);
    await page.getByPlaceholder(/quiet minimal cafe/i).fill('quiet amber late night');
    await page.mouse.wheel(0, 700);
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot('search-feed.png', snapshotOptions);
  });

  test('map view', async ({ page }) => {
    await openHome(page);
    await page.getByRole('button', { name: /spatial atlas/i }).click();
    await expect(page.getByRole('heading', { name: 'Map Engine Offline' })).toBeVisible();
    await expect(page).toHaveScreenshot('map-view.png', snapshotOptions);
  });

  test('venue detail', async ({ page }) => {
    await openHome(page);
    await page.getByText('Floreria Atlantico').first().click();
    await expect(page.getByRole('button', { name: /back/i })).toBeVisible();
    await expect(page).toHaveScreenshot('venue-detail.png', snapshotOptions);
  });

  test('saved', async ({ page }) => {
    await openHome(page);
    await page.getByRole('button', { name: 'Atlas', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Your Atlas' })).toBeVisible();
    await expect(page).toHaveScreenshot('saved.png', snapshotOptions);
  });

  test('profile', async ({ page }) => {
    await openHome(page);
    await page.getByRole('button', { name: /taste/i }).click();
    await expect(page.getByRole('heading', { name: 'Enter the Atlas' })).toBeVisible();
    await expect(page).toHaveScreenshot('profile.png', snapshotOptions);
  });

  test('admin dashboard', async ({ page }) => {
    await installBaselineMocks(page);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Semantic Divergence Inspection')).toBeVisible();
    await expect(page.getByText('Floreria Atlantico')).toBeVisible();
    await expect(page).toHaveScreenshot('admin-dashboard.png', snapshotOptions);
  });
});
