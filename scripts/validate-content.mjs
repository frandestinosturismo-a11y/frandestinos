// Confere o conteúdo antes de gerar o site: campos obrigatórios, ids repetidos,
// fotos que não existem em public/images e passeios ligados a destinos que
// saíram do ar. As regras de preenchimento são as mesmas que a página usa.
import { validarAgenda } from '../public/editor/agenda-validation.js';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const raiz = process.cwd();
const pastaTemporaria = join(raiz, '.validacao-conteudo');
const caminhoCatalogo = join(raiz, 'public', 'destinos.json');
const problemas = [];

try {
  execFileSync('npx', ['tsc', 'src/catalog.ts', '--outDir', pastaTemporaria, '--target', 'ES2022', '--module', 'ESNext', '--moduleResolution', 'bundler', '--skipLibCheck'], { stdio: 'inherit' });
} catch {
  console.error('Não foi possível preparar a conferência do conteúdo.');
  process.exit(1);
}

const { rawDestinationsFrom, validateCatalog } = await import(join(pastaTemporaria, 'catalog.js'));
rmSync(pastaTemporaria, { recursive: true, force: true });

let dados;
try {
  dados = JSON.parse(readFileSync(caminhoCatalogo, 'utf8'));
} catch (erro) {
  console.error(`Não foi possível ler public/destinos.json: ${erro.message}`);
  console.error('Verifique se o arquivo tem vírgulas e chaves no lugar certo. Uma vírgula sobrando já impede a leitura.');
  process.exit(1);
}

const destinos = rawDestinationsFrom(dados);
problemas.push(...validateCatalog(destinos));

const nomeImagem = (valor) => String(valor ?? '').replace(/^\/?images\//, '').replace(/\.(jpe?g|png|webp)$/i, '');
const existeImagem = (valor) => {
  const nome = nomeImagem(valor);
  if (!nome) return true;
  const arquivo = String(valor).replace(/^\/?images\//, '');
  return existsSync(join(raiz, 'public', 'images', /\.(jpe?g|png|webp)$/i.test(arquivo) ? arquivo : `${arquivo}.jpg`));
};

destinos.forEach((destino) => {
  const rotulo = String(destino?.nome ?? '').trim() || 'Destino sem nome';
  if (!existeImagem(destino?.imagem)) problemas.push(`${rotulo}: a foto principal "${nomeImagem(destino?.imagem)}" não existe em public/images.`);
  (Array.isArray(destino?.galeria) ? destino.galeria : []).forEach((foto, indice) => {
    if (!existeImagem(foto?.imagem)) problemas.push(`${rotulo}: a foto nº ${indice + 1} da galeria ("${nomeImagem(foto?.imagem)}") não existe em public/images.`);
  });
});

const ids = new Set(destinos.map(destino => String(destino?.id ?? '').trim()));
try {
  const passeios = JSON.parse(readFileSync(join(raiz, 'public', 'passeios.json'), 'utf8'));
  problemas.push(...validarAgenda(passeios, destinos));
  if (Array.isArray(passeios)) {
    passeios.forEach((passeio, indice) => {
      const alvo = String(passeio?.destinationId ?? '').trim();
      if (alvo && !ids.has(alvo)) problemas.push(`passeios.json: o passeio nº ${indice + 1} aponta para o destino "${alvo}", que não existe em destinos.json.`);
    });
  }
} catch (erro) {
  problemas.push(`passeios.json: não foi possível ler o arquivo (${erro.message}).`);
}

if (problemas.length) {
  console.error(`\nConteúdo com ${problemas.length} ${problemas.length === 1 ? 'problema' : 'problemas'}:\n`);
  problemas.forEach(problema => console.error(`  • ${problema}`));
  console.error('\nCorrija os itens acima e rode o comando de novo. Nenhum arquivo do site foi alterado.');
  process.exit(1);
}

console.log(`Conteúdo conferido: ${destinos.length} destinos, todas as fotos e passeios consistentes.`);
