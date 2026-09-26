import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const catalog = JSON.parse(readFileSync('public/destinos.json', 'utf8'));
const destination = { ...catalog.destinos[0], id: 'novo-destino-agenda', nome: 'Novo destino da agenda' };

test.beforeEach(async ({ page }) => {
  await page.route('**/destinos.json', route => route.fulfill({ json: { destinos: [...catalog.destinos, destination] } }));
});

test('destino novo aparece como EM BREVE mesmo sem saídas cadastradas', async ({ page }) => {
  await page.route('**/passeios.json', route => route.fulfill({ json: [] }));
  await page.goto('/');
  await expect(page.locator('#tour-list .tour-row')).toHaveCount(catalog.destinos.length + 1);
  await page.locator('#agenda-destination').selectOption(destination.id);
  await expect(page.locator('#tour-list .tour-row')).toHaveCount(1);
  await expect(page.locator('#tour-list')).toContainText(destination.nome);
  await expect(page.locator('#tour-list .tour-date')).toHaveText('EM BREVE');
  await expect(page.locator('#tour-list [data-calendar]')).toHaveCount(0);
});

test('preserva datas cadastradas sem duplicar destino e filtra por mês', async ({ page }) => {
  await page.route('**/passeios.json', route => route.fulfill({ json: [
    { id: 'saida-nova', destinationId: destination.id, title: 'Passeio novo', date: '2099-10-20', departure: 'Praça central', price: 120 },
  ] }));
  await page.goto('/');
  await page.locator('#agenda-destination').selectOption(destination.id);
  await expect(page.locator('#tour-list .tour-row')).toHaveCount(1);
  await expect(page.locator('#tour-list .tour-date')).toContainText('20');
  await expect(page.locator('#tour-list .tour-date')).toContainText('2099');
  await expect(page.locator('#tour-list')).toContainText('Praça central');
  await expect(page.locator('#tour-list [data-calendar]')).toBeVisible();
  await page.locator('#agenda-month').selectOption('pending');
  await expect(page.locator('#tour-list .tour-row')).toHaveCount(0);
  await page.locator('#agenda-month').selectOption('2099-10');
  await expect(page.locator('#tour-list .tour-row')).toHaveCount(1);
});

test('destino com saída passada volta a aparecer como EM BREVE', async ({ page }) => {
  await page.route('**/passeios.json', route => route.fulfill({ json: [
    { id: 'saida-antiga', destinationId: destination.id, title: 'Passeio antigo', date: '2000-01-01', departure: null, price: null },
  ] }));
  await page.goto('/');
  await page.locator('#agenda-destination').selectOption(destination.id);
  await expect(page.locator('#tour-list .tour-row')).toHaveCount(1);
  await expect(page.locator('#tour-list .tour-date')).toHaveText('EM BREVE');
  await expect(page.locator('#tour-list')).not.toContainText('Passeio antigo');
});

test('ordena datas cronologicamente e pendentes pela ordem definida no editor', async ({ page }) => {
  const reversedCatalog = [...catalog.destinos].reverse();
  await page.unroute('**/destinos.json');
  await page.route('**/destinos.json', route => route.fulfill({ json: { destinos: reversedCatalog } }));
  await page.route('**/passeios.json', route => route.fulfill({ json: [
    { id: 'pending-first-in-file', destinationId: catalog.destinos[0].id, title: 'Pendente A', date: null, departure: null, price: null },
    { id: 'later', destinationId: catalog.destinos[1].id, title: 'Data posterior', date: '2099-12-20', departure: null, price: null },
    { id: 'pending-last-in-file', destinationId: catalog.destinos.at(-1).id, title: 'Pendente B', date: null, departure: null, price: null },
    { id: 'earlier', destinationId: catalog.destinos[2].id, title: 'Data anterior', date: '2099-10-10', departure: null, price: null },
  ] }));

  await page.goto('/');
  const titles = await page.locator('#tour-list .tour-info h3').allTextContents();
  expect(titles.slice(0, 2)).toEqual(['Data anterior', 'Data posterior']);
  expect(titles.slice(2)).toEqual(reversedCatalog.filter(destination => ![catalog.destinos[1].id, catalog.destinos[2].id].includes(destination.id)).map(destination => {
    if (destination.id === catalog.destinos.at(-1).id) return 'Pendente B';
    if (destination.id === catalog.destinos[0].id) return 'Pendente A';
    return destination.nome;
  }));
});
