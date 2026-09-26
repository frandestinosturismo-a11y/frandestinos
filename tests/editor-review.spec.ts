import { test, expect } from '@playwright/test';

test('mantém edições ao trocar e reordenar destinos e filtra a lista', async ({ page }) => {
  await page.goto('/editor/');
  const original = await page.locator('[name=nome]').inputValue();
  await page.locator('[name=resumo]').fill('Resumo de revisão preservado');
  await expect(page.locator('#estado-salvo')).toHaveText('Alterações não salvas');
  await page.locator('.item-escolher').nth(1).click();
  await page.locator('.item-escolher').first().click();
  await expect(page.locator('[name=resumo]')).toHaveValue('Resumo de revisão preservado');
  await page.locator('#lista-destinos li').first().getByRole('button', { name: /para baixo/ }).click();
  await expect(page.locator('#lista-destinos li').nth(1)).toContainText(original);
  await expect(page.locator('[name=resumo]')).toHaveValue('Resumo de revisão preservado');
  await page.locator('#buscar').fill('destino inexistente xyz');
  await expect(page.locator('#sem-resultados')).toBeVisible();
  await page.locator('#buscar').fill('');
  await page.locator('#descartar').click();
  await expect(page.locator('#lista-destinos li').first()).toContainText(original);
  await expect(page.locator('#estado-salvo')).toContainText('Conteúdo salvo');
});

test('impede salvar outro destino quando há um cadastro incompleto', async ({ page }) => {
  let posts = 0;
  await page.route('**/__conteudo__/destinos', async route => {
    if (route.request().method() === 'POST') { posts++; await route.fulfill({ json: { gravado: true } }); }
    else await route.continue();
  });
  await page.goto('/editor/');
  await page.locator('#novo').click();
  await page.locator('[name=nome]').fill('Cadastro incompleto');
  await page.locator('.item-escolher').nth(1).click();
  await page.locator('#salvar').click();
  await expect(page.locator('#erros')).toBeVisible();
  await expect(page.locator('[name=nome]')).toHaveValue('Cadastro incompleto');
  expect(posts).toBe(0);
});

test('editor cabe na tela e permite navegar pelas seções', async ({ page }, testInfo) => {
  await page.goto('/editor/');
  await expect(page.locator('[name=nome]')).not.toHaveValue('');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `artifacts/revisao/editor-novo-${testInfo.project.name}.png` });
  await page.locator('#secoes').getByRole('link', { name: 'Fotos', exact: true }).click();
  await expect(page.locator('[name=imagem]')).toBeInViewport();
});
