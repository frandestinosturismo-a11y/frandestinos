import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const catalogo = JSON.parse(readFileSync('public/destinos.json', 'utf8'));
const agenda = JSON.parse(readFileSync('public/passeios.json', 'utf8'));

test('categorias e textos personalizados são gravados e exibidos no site', async ({ page }) => {
  let salvo = structuredClone(catalogo);
  await page.route('**/__conteudo__/destinos', async route => {
    if (route.request().method() === 'POST') { salvo = route.request().postDataJSON(); await route.fulfill({ json: { gravado: true } }); }
    else await route.fulfill({ json: salvo });
  });
  await page.goto('/editor/');
  await expect(page.locator('[name=calendarioTitulo]')).toHaveValue('Guarde a data');
  await page.locator('#categoria-nova').fill('Ecoturismo especial');
  await page.locator('#adicionar-categoria').click();
  await page.locator('[name=calendarioTitulo]').fill('Reserve esta data');
  await page.locator('[name=calendarioPendente]').fill('A próxima aventura vem aí.');
  await page.locator('#salvar').click();
  await expect(page.locator('#aviso')).toContainText('atualizado');
  expect(salvo.destinos[0].categorias).toContain('Ecoturismo especial');
  await page.route('**/destinos.json', route => route.fulfill({ json: salvo }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Ecoturismo especial', exact: true }).click();
  await expect(page.locator('#destination-grid .destination-card')).toHaveCount(1);
  await page.locator('#destination-grid .card-image-button').click();
  await expect(page.locator('.detail-calendar')).toContainText('Reserve esta data');
  await expect(page.locator('.detail-calendar')).toContainText('A próxima aventura vem aí.');
});

test('agenda vem preenchida e permite salvar data, embarque e valor zero', async ({ page }) => {
  let salvo: any;
  await page.route('**/__conteudo__/destinos?arquivo=passeios.json', async route => {
    salvo = route.request().postDataJSON(); await route.fulfill({ json: { gravado: true } });
  });
  await page.goto('/editor/');
  await expect(page.locator('#agenda-itens fieldset')).toHaveCount(agenda.length);
  const ficha = page.locator('#agenda-itens fieldset').first();
  await expect(ficha.getByLabel('Título do passeio')).toHaveValue(agenda[0].title);
  await expect(ficha.getByLabel('Data confirmada (opcional)')).toHaveValue(agenda[0].date || '');
  await ficha.getByLabel('Data confirmada (opcional)').fill('2099-10-20');
  await ficha.getByLabel('Local de embarque (opcional)').fill('Praça central');
  await ficha.getByLabel('Preço por pessoa em R$ (opcional)').fill('0');
  await page.locator('#salvar-agenda').click();
  await expect(page.locator('#agenda-status')).toContainText('Agenda salva');
  expect(salvo[0]).toMatchObject({ date: '2099-10-20', departure: 'Praça central', price: 0 });
  await page.route('**/passeios.json', route => route.fulfill({ json: salvo }));
  await page.goto(`/?destino=${agenda[0].destinationId}`);
  await expect(page.locator('.detail-calendar [data-calendar]')).toBeVisible();
});
