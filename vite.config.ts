import { defineConfig, type Connect, type Plugin } from 'vite';
import { copyFileSync, readdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const EDITOR_PATHS = ['/editor', '/editor/'];
const API = '/__conteudo__/destinos';
const COPIA = /^(?:destinos|passeios)-copia-\d+\.json$/;
const NOME_SEGURO = /^[a-z0-9][a-z0-9-]*\.json$/;
const COPIAS_MANTIDAS = 10;
const pastaPublica = () => join(process.cwd(), 'public');
/** Aceita apenas nomes simples dentro de public/, para não gravar fora do projeto. */
const alvoDoPedido = (url: string): string => {
  const pedido = new URL(url, 'http://localhost').searchParams.get('arquivo');
  return pedido && NOME_SEGURO.test(pedido) ? join(pastaPublica(), pedido) : join(pastaPublica(), 'destinos.json');
};

/** Guarda uma cópia datada do arquivo e mantém só as mais recentes. */
function copiarAntesDeGravar(arquivo: string) {
  const prefixo = arquivo.endsWith('/passeios.json') ? 'passeios' : 'destinos';
  copyFileSync(arquivo, join(pastaPublica(), `${prefixo}-copia-${Date.now()}.json`));
  const copias = readdirSync(pastaPublica()).filter(nome => COPIA.test(nome) && nome.startsWith(prefixo)).sort();
  copias.slice(0, Math.max(0, copias.length - COPIAS_MANTIDAS)).forEach(nome => {
    try { unlinkSync(join(pastaPublica(), nome)); } catch { /* cópia antiga já removida */ }
  });
}

const lerCorpo = (req: Connect.IncomingMessage): Promise<string> => new Promise((resolve, reject) => {
  let dados = '';
  req.on('data', parte => { dados += parte; });
  req.on('end', () => resolve(dados));
  req.on('error', reject);
});

// O editor de conteúdo vive em public/editor e precisa de duas ajudas do
// servidor local: abrir /editor/ (o fallback de SPA devolveria a página do site)
// e gravar public/destinos.json direto, sem passar pela pasta de downloads.
const editorLocal = (): Plugin => {
  const rotas = (req: Connect.IncomingMessage, res: { statusCode: number; setHeader: (nome: string, valor: string) => void; end: (corpo?: string) => void }, next: Connect.NextFunction) => {
    if (req.url === '/__conteudo__/disponivel') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ disponivel: true, arquivo: 'public/destinos.json' }));
      return;
    }
    if (!req.url || !req.url.startsWith(API)) { next(); return; }
    const arquivo = alvoDoPedido(req.url);
    const nomeArquivo = `public/${arquivo.slice(pastaPublica().length + 1)}`;
    if (req.method === 'GET') {
      try {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(readFileSync(arquivo, 'utf8'));
      } catch (erro) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ erro: `Não foi possível ler ${nomeArquivo}: ${String(erro)}` }));
      }
      return;
    }
    if (req.method === 'POST') {
      void lerCorpo(req).then((corpo) => {
        try {
          JSON.parse(corpo);
        } catch {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ erro: 'O conteúdo enviado não é um JSON válido.' }));
          return;
        }
        try {
          // Cópia de segurança antes de sobrescrever.
          copiarAntesDeGravar(arquivo);
          writeFileSync(arquivo, corpo, 'utf8');
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ gravado: true, arquivo: nomeArquivo }));
        } catch (erro) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ erro: `Não foi possível gravar ${nomeArquivo}: ${String(erro)}` }));
        }
      });
      return;
    }
    res.statusCode = 405;
    res.end();
  };

  return {
    name: 'editor-local',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && EDITOR_PATHS.includes(req.url)) req.url = '/editor/index.html';
        rotas(req, res, next);
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && EDITOR_PATHS.includes(req.url)) req.url = '/editor/index.html';
        rotas(req, res, next);
      });
    },
  };
};

// A ferramenta de edição é só para uso local: nunca vai para a pasta publicada.
const editorForaDoSite = (): Plugin => ({
  name: 'editor-fora-do-site',
  apply: 'build',
  closeBundle() {
    rmSync(join(process.cwd(), 'dist', 'editor'), { recursive: true, force: true });
    readdirSync(join(process.cwd(), 'dist')).filter(nome => COPIA.test(nome)).forEach(nome => {
      unlinkSync(join(process.cwd(), 'dist', nome));
    });
  },
});

export default defineConfig({
  plugins: [editorLocal(), editorForaDoSite()],
  server: {
    port: 5173,
    strictPort: true,
    allowedHosts: true,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
});
