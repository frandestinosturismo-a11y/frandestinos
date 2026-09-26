import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';

const catalogo = JSON.parse(readFileSync('public/destinos.json', 'utf8')) as {
 destinos: { id: string; nome: string; imagem: string; resumo: string }[];
};

test('a página pública não oferece mais favoritos', async ({page})=>{
 await page.goto('/');
 await expect(page.locator('[data-favorite]')).toHaveCount(0);
 await expect(page.locator('.destinations-toolbar')).not.toContainText('Meus favoritos');
 await expect(page.locator('#destination-grid')).not.toContainText('favoritos');
});

test('o site não quebra quando o arquivo de destinos falha', async ({page})=>{
 await page.route('**/destinos.json',route=>route.fulfill({status:500,body:'erro'}));
 await page.goto('/');
 await expect(page.locator('.empty-destinations')).toContainText('Estamos preparando os próximos destinos');
 await expect(page.locator('.site-header')).toBeVisible();
});

test('o editor local carrega, valida e desfaz alterações não salvas', async ({page})=>{
 await page.goto('/editor/');
 await expect(page.getByRole('heading',{name:'Editor de destinos'})).toBeVisible();
 await expect(page.locator('#lista-destinos li')).toHaveCount(catalogo.destinos.length);
 await page.locator('#lista-destinos li').first().getByRole('button').first().click();
 await expect(page.locator('#ficha-campos')).toBeVisible();
 await expect(page.locator('[name="nome"]')).toHaveValue(catalogo.destinos[0].nome);
 const resumoOriginal = await page.locator('[name="resumo"]').inputValue();
 expect(resumoOriginal).toBe(catalogo.destinos[0].resumo);
 await page.locator('[name="resumo"]').fill('');
 await page.locator('#salvar').click();
 await expect(page.locator('#erros')).toBeVisible();
 await expect(page.locator('#erros')).toContainText('resumo');
 await page.locator('#descartar').click();
 await expect(page.locator('[name="resumo"]')).toHaveValue(resumoOriginal);
});

test('o editor grava direto em public/destinos.json pelo servidor do projeto', async ({page})=>{
 const disponivel = await page.request.get('/__conteudo__/disponivel');
 test.skip(!disponivel.ok(), 'Sem o servidor local do projeto não há gravação direta.');
 // A rota aceita ?arquivo= para os testes usarem um arquivo descartável.
 const descartavel = 'teste-editor-destinos.json';
 writeFileSync(`public/${descartavel}`, readFileSync('public/destinos.json','utf8'));
 try {
  const dados = JSON.parse(readFileSync('public/destinos.json','utf8'));
  dados.destinos.unshift({ id:'buzios', nome:'Búzios', regiao:'Região dos Lagos', categorias:['litoral'], resumo:'Praias e brisa.', descricao:'Um destino de mar cristalino.', imagem:'arraial', roteiro:[{ horario:null, titulo:'Encontro e embarque', descricao:'Ponto a combinar com a Fran.' }] });
  const gravacao = await page.request.post(`/__conteudo__/destinos?arquivo=${descartavel}`, { data: dados });
  expect(gravacao.ok()).toBe(true);
  expect((await gravacao.json()).gravado).toBe(true);
  const gravado = JSON.parse(readFileSync(`public/${descartavel}`,'utf8'));
  expect(gravado.destinos[0].id).toBe('buzios');
  expect(gravado.destinos[0].roteiro).toHaveLength(1);
  expect(JSON.parse(readFileSync('public/destinos.json','utf8')).destinos).toHaveLength(catalogo.destinos.length);
  const copias = readdirSync('public').filter(nome=>/^destinos-copia-\d+\.json$/.test(nome));
  expect(copias.length).toBeGreaterThan(0);
 } finally {
  rmSync(`public/${descartavel}`, { force:true });
  readdirSync('public').filter(nome=>/^destinos-copia-\d+\.json$/.test(nome)).forEach(nome=>rmSync(`public/${nome}`,{force:true}));
 }
});

test('o roteiro do destino é editável no editor e vem preenchido', async ({page})=>{
 await page.goto('/editor/');
 await page.locator('#lista-destinos li').first().getByRole('button').first().click();
 await expect(page.locator('#roteiro .roteiro-linha')).toHaveCount(4);
 await expect(page.locator('#roteiro .roteiro-linha').first().locator('input').nth(1)).toHaveValue('Encontro e embarque');
 await expect(page.locator('#roteiro .roteiro-linha').first().locator('input').nth(2)).not.toHaveValue('');
});

test('destino novo entra na primeira posição da lista', async ({page})=>{
 await page.goto('/editor/');
 await page.locator('#novo').click();
 await expect(page.locator('#lista-destinos li').first()).toContainText('(sem nome)');
 await page.locator('[name="nome"]').fill('Teste da primeira posição');
 await expect(page.locator('#lista-destinos li').first()).toContainText('Teste da primeira posição');
 await expect(page.locator('#lista-destinos li')).toHaveCount(catalogo.destinos.length + 1);
 await page.locator('#descartar').click();
 await expect(page.locator('#lista-destinos li')).toHaveCount(catalogo.destinos.length);
});

test('todos os destinos do arquivo de conteúdo aparecem na página', async ({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:/Conhecer todos os destinos/}).click();
 await expect(page.locator('#destination-grid .destination-card')).toHaveCount(catalogo.destinos.length);
 for (const destino of catalogo.destinos) {
  await expect(page.locator(`[data-destination="${destino.id}"]`).first()).toBeVisible();
  await expect(page.locator(`#destination-grid`)).toContainText(destino.nome);
 }
});

test('compare two destinations, enforce limit and open destination', async ({page})=>{
 await page.goto('/');
 await page.locator('[data-compare="petropolis"]').click();
 await expect(page.locator('#open-comparison')).toBeDisabled();
 await page.locator('[data-compare="penedo"]').click();
 await page.locator('[data-compare="teresopolis"]').click();
 await expect(page.locator('#experience-toast')).toContainText('até dois');
 await page.locator('#open-comparison').click();
 await expect(page.getByRole('dialog',{name:/Dois destinos/})).toBeVisible();
 await expect(page.locator('.comparison-table')).toContainText('Petrópolis');
 await expect(page.locator('.comparison-table')).toContainText('Penedo');
 await expect(page.locator('.comparison-table')).not.toContainText('Teresópolis');
 await page.locator('[data-compare-open="penedo"]').click();
 await expect(page.getByRole('dialog',{name:'Penedo',exact:true})).toBeVisible();
 await expect(page.locator('body')).toHaveClass(/modal-open/);
 await page.keyboard.press('Escape');
 await expect(page.locator('body')).not.toHaveClass(/modal-open/);
 await page.locator('#clear-comparison').click();
 await expect(page.locator('.compare-tray')).toBeHidden();
});

test('quiz matches scenario and carries preferences into optional consultation', async ({page})=>{
 await page.goto('/');
 await page.locator('[name=scenery]').selectOption('serra');
 await page.locator('[name=pace]').selectOption('relax');
 await page.locator('[name=party]').selectOption('Vou com a família');
 await page.getByRole('button',{name:'Encontrar meu passeio'}).click();
 await expect(page.locator('.quiz-matches button')).toHaveCount(2);
 await expect(page.locator('.quiz-matches')).not.toContainText('Arraial');
 await page.locator('.quiz-matches [data-destination="penedo"]').click();
 await page.getByText('Deixe a consulta do seu jeito').click();
 await page.getByLabel('Quantas pessoas?').fill('4');
 await page.getByLabel('Preferência de embarque').fill('Tijuca');
 const url=new URL((await page.locator('#consult-link').getAttribute('href'))!);
 expect(url.pathname).toBe('/5521972177007');
 const message=url.searchParams.get('text');
 expect(message).toContain('Penedo');expect(message).toContain('4 pessoa');expect(message).toContain('Tijuca');expect(message).toContain('Vou com a família');expect(message).toContain('descansar e aproveitar na serra');
 await page.getByLabel('Quantas pessoas?').fill('0');
 await expect(page.locator('#consult-error')).toContainText('1 a 99');
 await page.getByLabel('Quantas pessoas?').fill('');
 await expect(page.locator('#consult-error')).toHaveText('');
});

test('shared links open the right destination and clipboard fallback is usable', async ({page})=>{
 await page.addInitScript(()=>{
  Object.defineProperty(navigator,'share',{value:undefined,configurable:true});
  Object.defineProperty(navigator,'clipboard',{value:{writeText:()=>Promise.reject(new Error('denied'))},configurable:true});
 });
 await page.goto('/?destino=teresopolis');
 await expect(page.getByRole('dialog',{name:'Teresópolis',exact:true})).toBeVisible();
 await page.locator('#modal-content [data-share]').click();
 await expect(page.locator('#share-modal')).toBeVisible();
 const shareUrl=await page.locator('#share-url').inputValue();
 expect(new URL(shareUrl).searchParams.get('destino')).toBe('teresopolis');
 await page.getByRole('button',{name:'Copiar link',exact:true}).click();
 await expect(page.locator('#share-feedback')).toContainText('Selecione o link');
 await page.getByRole('button',{name:'Fechar compartilhamento'}).click();
 await expect(page.getByRole('dialog',{name:'Teresópolis',exact:true})).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(page).not.toHaveURL(/destino=/);
 await page.goto('/?destino=unknown');
 await expect(page.locator('#destination-modal')).toBeHidden();
});

test('clipboard success and native sharing include an actual deep link', async ({page})=>{
 await page.addInitScript(()=>{
  Object.defineProperty(navigator,'share',{value:undefined,configurable:true});
  Object.defineProperty(navigator,'clipboard',{value:{writeText:(text:string)=>{(window as any).copied=text;return Promise.resolve();}},configurable:true});
 });
 await page.goto('/');
 await page.locator('.destination-penedo [data-share]').click();
 await expect(page.locator('#experience-toast')).toContainText('Link copiado');
 expect(await page.evaluate(()=>(window as any).copied)).toContain('?destino=penedo');
 await page.evaluate(()=>{Object.defineProperty(navigator,'share',{value:(data:unknown)=>{(window as any).shared=data;return Promise.resolve();},configurable:true});});
 await page.locator('.destination-petropolis [data-share]').click();
 expect((await page.evaluate(()=>(window as any).shared)).url).toContain('?destino=petropolis');
});

test('storage bloqueado não impede a navegação nem a consulta',async({page})=>{
 await page.addInitScript(()=>{Storage.prototype.setItem=()=>{throw new Error('denied')};});
 await page.goto('/');
 await expect(page.locator('.destination-card')).not.toHaveCount(0);
 const notify=page.locator('.tour-actions a').first();
 await expect(notify).toHaveText('Quero saber da próxima saída');
 const message=new URL((await notify.getAttribute('href'))!).searchParams.get('text');
 expect(message).toContain('receber novidades');
 await page.locator('.tour-actions button').first().click();
 await expect(page.locator('#destination-modal')).toBeVisible();
 await expect(page.locator('#consult-link')).toHaveAttribute('href',/wa.me\/5521972177007/);
});

test('scheduled consultation retains the selected date after adding preferences',async({page})=>{
 await page.route('**/passeios.json',route=>route.fulfill({json:[{id:'dated',destinationId:'penedo',title:'Penedo especial',date:'2099-11-15',departure:'Centro',price:150}]}));
 await page.goto('/');
 await page.getByRole('button',{name:'Personalizar consulta',exact:true}).click();
 let message=new URL((await page.locator('#consult-link').getAttribute('href'))!).searchParams.get('text');
 expect(message).toContain('Penedo especial');expect(message).toContain('15 de novembro de 2099');
 await page.getByText('Deixe a consulta do seu jeito').click();
 await page.getByLabel('Quantas pessoas?').fill('3');
 message=new URL((await page.locator('#consult-link').getAttribute('href'))!).searchParams.get('text');
 expect(message).toContain('15 de novembro de 2099');expect(message).toContain('3 pessoa');
});
