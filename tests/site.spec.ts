import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const catalogo = JSON.parse(readFileSync('public/destinos.json', 'utf8')) as {
  destinos: { id: string; nome: string; categorias: string[] }[];
};
const doLitoral = catalogo.destinos.filter(destino => destino.categorias.includes('litoral'));
const primeiroDoLitoral = doLitoral[0];

test('destinations, filters, detail dialog and WhatsApp are functional', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('O próximo destino');
  await expect(page.locator('.destination-card')).toHaveCount(3);
  await page.getByRole('button', { name: 'Sol & mar' }).click();
  await expect(page.locator('.destination-card')).toHaveCount(doLitoral.length);
  await expect(page.locator('#destination-grid')).toContainText(primeiroDoLitoral.nome);
  await expect(page.locator('#destination-grid')).not.toContainText('Petrópolis');
  await page.getByRole('button', { name: 'Todos os destinos', exact: true }).click();
  await page.getByRole('button', { name: 'Conhecer todos os destinos' }).click();
  await expect(page.locator('.destination-card')).toHaveCount(catalogo.destinos.length);
  await page.getByRole('button', { name: 'Conhecer Petrópolis', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Petrópolis' })).toBeVisible();
  const link = page.getByRole('link', { name: 'Consultar passeio para Petrópolis', exact: true }).first();
  const url = new URL((await link.getAttribute('href'))!);
  expect(url.hostname).toBe('wa.me');
  expect(url.pathname).toBe('/5521972177007');
  expect(url.searchParams.get('text')).toContain('Petrópolis');
  await page.keyboard.press('Escape');
  await expect(page.locator('#destination-modal')).not.toBeVisible();
  expect(errors).toEqual([]);
});

test('trip finder preserves destination and travel party; agenda has honest empty states', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.tour-row')).toHaveCount(3);
  await page.locator('#finder-destination').selectOption('penedo');
  await page.locator('#finder-company').selectOption('Vou com a família');
  await page.getByRole('button', { name: 'Explorar passeios' }).click();
  await expect(page.locator('.tour-row')).toHaveCount(1);
  await expect(page.locator('#agenda-destination')).toHaveValue('penedo');
  const url = new URL((await page.locator('.tour-link').getAttribute('href'))!);
  expect(url.searchParams.get('text')).toContain('Vou com a família');
  await expect(page.locator('.tour-row')).toContainText('DATA A CONFIRMAR');
  await page.locator('#agenda-destination').selectOption('paraty');
  await expect(page.locator('.empty-agenda')).toContainText('Paraty');
  await page.getByRole('button', { name: 'Limpar', exact: true }).click();
  await expect(page.locator('.tour-row')).toHaveCount(3);
});

test('published dates can be filtered, past dates are hidden and failure offers WhatsApp', async ({ page }) => {
  await page.route('**/passeios.json', route => route.fulfill({ json: [
    {id:'future',destinationId:'penedo',title:'Penedo no futuro',date:'2099-11-15',departure:'Centro',price:150},
    {id:'old',destinationId:'petropolis',title:'Passeio passado',date:'2020-01-01',departure:null,price:null},
    {id:'pending',destinationId:'teresopolis',title:'Passeio em preparação',date:null,departure:null,price:null},
  ] }));
  await page.goto('/');
  await expect(page.locator('.tour-row')).toHaveCount(2);
  await page.locator('#agenda-month').selectOption('2099-11');
  await expect(page.locator('.tour-row')).toHaveCount(1);
  await expect(page.locator('.tour-row')).toContainText('150,00');
  await expect(page.locator('.tour-row')).toContainText('2099');
  await page.locator('#agenda-month').selectOption('pending');
  await expect(page.locator('.tour-row')).toHaveCount(1);
  await expect(page.locator('.tour-row')).toContainText('Passeio em preparação');
  await page.route('**/passeios.json', route => route.fulfill({ status: 500, body: 'error' }));
  await page.reload();
  await expect(page.locator('#agenda-status')).toContainText('Não foi possível');
  await expect(page.locator('#tour-list').getByRole('link', {name:'Consultar pelo WhatsApp'})).toBeVisible();
});

test('testimonials are clearly illustrative, FAQ and photo credits work', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.review-set:not(.review-copy) .review-card')).toHaveCount(7);
  await expect(page.locator('.review-set:not(.review-copy) .illustrative-label')).toHaveCount(7);
  await expect(page.locator('.testimonials-disclaimer')).toContainText('fictícios');
  await page.getByText('Como faço para reservar um passeio?', {exact:true}).click();
  await expect(page.locator('details[open]')).toContainText('WhatsApp');
  await page.getByRole('button', {name:'Créditos das imagens'}).click();
  await expect(page.locator('#credits-modal')).toBeVisible();
  await expect(page.locator('#credits-content article')).toHaveCount(18);
  await page.getByRole('button', {name:'Fechar créditos'}).click();
  await expect(page.locator('#credits-modal')).not.toBeVisible();
});

test('responsive layout, mobile menu, local images and screenshots', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  // Destinos e depoimentos chegam de arquivos JSON; espere o conteúdo entrar
  // na página antes de percorrer e conferir as imagens.
  await expect(page.locator('.review-card').first()).toBeVisible();
  await expect(page.locator('#destination-grid .destination-card').first()).toBeVisible();
  if (testInfo.project.name === 'mobile') {
    await page.getByRole('button', { name: 'Abrir menu' }).click();
    await expect(page.locator('#main-nav')).toBeVisible();
    await page.locator('#main-nav').getByRole('link', {name:'Depoimentos'}).click();
    await expect(page.locator('#main-nav')).not.toBeVisible();
  }
  // Scroll through the page to ensure lazy images load before checking them.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo({top:y,behavior:'instant'}); await new Promise(r => setTimeout(r,30)); }
  });
  // Request offscreen carousel images too, so every asset is checked.
  await page.locator('.review-carousel img').evaluateAll(images => images.forEach(img => { (img as HTMLImageElement).loading = 'eager'; }));
  // Browsers defer hidden lazy thumbnails in the compact ticket layout; o que
  // importa aqui é que toda imagem visível tenha sido realmente baixada.
  await page.waitForFunction(() => [...document.images].every(img => img.getClientRects().length === 0 || img.naturalWidth > 0));
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  expect(overflow).toBe(false);
  await page.evaluate(() => window.scrollTo({top:0,behavior:'instant'}));
  await page.screenshot({path:`test-results/${testInfo.project.name}-full.png`, fullPage:true, animations:'disabled'});
});
