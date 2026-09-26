// Editor local do conteúdo do site (não é publicado na hospedagem).
// Lê public/destinos.json, permite criar/editar/excluir destinos e grava o
// arquivo de volta, com confirmação e cópia de segurança.

const ICONES = [
  ['landmark', 'Monumento / história'],
  ['mountain', 'Montanha / serra'],
  ['coffee', 'Café / gastronomia'],
  ['waves', 'Praia / mar'],
  ['camera', 'Cultura / fotografia'],
  ['sun', 'Sol / cidade'],
];
const CATEGORIAS = new Map([['serra', 'Serra & charme'], ['litoral', 'Sol & mar'], ['cultura', 'Cultura & história'], ['Natureza & aventura', 'Natureza & aventura'], ['Gastronomia', 'Gastronomia'], ['Compras & lazer', 'Compras & lazer'], ['Turismo religioso', 'Turismo religioso']]);
const CALENDARIO = { titulo: 'Guarde a data', confirmado: 'Leve este passeio para a agenda do seu celular.', pendente: 'Assim que a data for publicada, você poderá salvar o passeio no calendário.' };
function desenharCategorias(selecionadas = []) {
  const valores = [...new Set([...CATEGORIAS.keys(), ...estado.destinos.flatMap(d => d.categorias || []), ...selecionadas])];
  el('#opcoes-categorias').replaceChildren(...valores.map(valor => {
    const input = criar('input', { type: 'checkbox', name: 'categorias', value: valor });
    input.checked = selecionadas.includes(valor);
    return criar('label', { class: 'check' }, [input, document.createTextNode(CATEGORIAS.get(valor) || valor)]);
  }));
}

const ARQUIVO = 'destinos.json';
const CAMINHO_NO_PROJETO = 'public/destinos.json';

const el = (seletor) => document.querySelector(seletor);
const aviso = el('#aviso');
const form = el('#form');
const campos = el('#ficha-campos');
const fichaVazia = el('#ficha-vazia');

let estado = { schema: '', destinos: [] };
let indiceAtual = -1;
let salvoJSON = '';
let fileHandle = null;
let trocou = false;

/* ---------------------------------- apoio --------------------------------- */

function avisar(tipo, texto) {
  aviso.className = `aviso ${tipo}`;
  aviso.textContent = texto;
  aviso.hidden = false;
  clearTimeout(avisar.timer);
  avisar.timer = setTimeout(() => { aviso.hidden = true; }, 9000);
}

function slug(texto) {
  return String(texto ?? '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function texto(v) { return typeof v === 'string' ? v.trim() : ''; }
function listaTexto(v) { return Array.isArray(v) ? v.map(texto).filter(Boolean) : []; }

function criar(tag, atributos = {}, filhos = []) {
  const node = document.createElement(tag);
  Object.entries(atributos).forEach(([chave, valor]) => {
    if (chave === 'class') node.className = valor;
    else if (chave === 'texto') node.textContent = valor;
    else if (chave.startsWith('on')) node.addEventListener(chave.slice(2), valor);
    else if (valor !== null && valor !== undefined) node.setAttribute(chave, valor);
  });
  filhos.forEach(filho => node.append(filho));
  return node;
}

function urlImagem(nome) {
  const limpo = texto(nome).replace(/^\/?images\//, '');
  return limpo ? `../images/${limpo}${/\.(jpe?g|png|webp)$/i.test(limpo) ? '' : '.jpg'}` : '';
}

const mensagemGravacao = () => `Alterações prontas. Clique em “Salvar alterações” para gravar ${CAMINHO_NO_PROJETO}.`;

/* O servidor local do projeto expõe uma rota que grava o arquivo direto em
   public/destinos.json. Sem ela, o editor cai no modo de baixar/substituir. */
const API = '/__conteudo__/destinos';
let gravacaoDireta = false;

async function verificarGravacaoDireta() {
  try {
    const resposta = await fetch('/__conteudo__/disponivel', { cache: 'no-cache' });
    if (!resposta.ok) return false;
    const dados = await resposta.json();
    return dados?.disponivel === true;
  } catch {
    return false;
  }
}

/* --------------------------------- leitura -------------------------------- */

async function carregar() {
  gravacaoDireta = await verificarGravacaoDireta();
  try {
    // 1) Caminho preferido: o servidor local entrega e grava o arquivo do projeto.
    if (gravacaoDireta) {
      const resposta = await fetch(API, { cache: 'no-cache' });
      if (!resposta.ok) throw new Error(String(resposta.status));
      aplicar(await resposta.json());
      return;
    }
    // 2) Sem o servidor local: lê o arquivo publicado ao lado do editor.
    const resposta = await fetch(`../${ARQUIVO}`, { cache: 'no-cache' });
    if (!resposta.ok) throw new Error(String(resposta.status));
    aplicar(await resposta.json());
  } catch {
    avisar('erro', `Não foi possível ler ${ARQUIVO}. Abra o editor pelo endereço local do projeto (por exemplo http://localhost:5173/editor/) com o servidor ligado.`);
  }
}

function aplicar(dados) {
  estado = {
    schema: texto(dados.$schema),
    destinos: Array.isArray(dados.destinos) ? dados.destinos : [],
  };
  salvoJSON = JSON.stringify(estado);
  atualizarStatus();
  desenharLista();
  if (estado.destinos.length) selecionar(0);
  if (!gravacaoDireta) {
    avisar('info', 'Este navegador não consegue gravar direto no projeto. Ao salvar, o editor baixa o arquivo destinos.json para você substituir o de public/.');
  }
}

/* ------------------------------ lista à esquerda --------------------------- */

function desenharLista() {
  const lista = el('#lista-destinos');
  lista.textContent = '';
  el('#contagem').textContent = String(estado.destinos.length);
  el('#lista-vazia').hidden = estado.destinos.length > 0;
  estado.destinos.forEach((destino, indice) => {
    const item = criar('li', { class: indice === indiceAtual ? 'atual' : '' });
    const escolher = criar('button', { class: 'item-escolher', type: 'button', onclick: () => selecionar(indice) }, [
      criar('span', { class: 'item-nome', texto: texto(destino.nome) || '(sem nome)' }),
      criar('span', { class: 'item-meta', texto: `${texto(destino.id) || 'sem id'} · ${texto(destino.regiao) || 'sem região'}` }),
    ]);
    const ordem = criar('div', { class: 'item-ordem' }, [
      criar('button', { type: 'button', title: 'Mover para cima', 'aria-label': `Mover ${texto(destino.nome) || 'destino'} para cima`, disabled: indice === 0 ? 'disabled' : null, texto: '↑', onclick: () => mover(indice, -1) }),
      criar('button', { type: 'button', title: 'Mover para baixo', 'aria-label': `Mover ${texto(destino.nome) || 'destino'} para baixo`, disabled: indice === estado.destinos.length - 1 ? 'disabled' : null, texto: '↓', onclick: () => mover(indice, 1) }),
    ]);
    item.append(escolher, ordem);
    lista.append(item);
  });
  filtrarLista();
}

/** Atualiza o rótulo do item na lista enquanto os campos são digitados. */
function atualizarRotulo(indice) {
  if (indice < 0) return;
  const destino = estado.destinos[indice];
  if (!destino) return;
  const valor = (nome) => texto(form.querySelector(`[name="${nome}"]`)?.value);
  destino.nome = valor('nome');
  destino.id = valor('id');
  destino.regiao = valor('regiao');
  const item = el('#lista-destinos').children[indice];
  if (!item) return;
  const nome = item.querySelector('.item-nome');
  const meta = item.querySelector('.item-meta');
  if (nome) nome.textContent = texto(destino.nome) || '(sem nome)';
  if (meta) meta.textContent = `${texto(destino.id) || 'sem id'} · ${texto(destino.regiao) || 'sem região'}`;
}

function mover(indice, passo) {  const destino = estado.destinos.splice(indice, 1)[0];
  estado.destinos.splice(indice + passo, 0, destino);
  if (indiceAtual === indice) indiceAtual = indice + passo;
  else if (indiceAtual === indice + passo) indiceAtual = indice;
  desenharLista();
  selecionar(indiceAtual);
  marcarAlteracao();
}

/* -------------------------------- ficha atual ----------------------------- */

function selecionar(indice) {
  if (indice < 0 || indice >= estado.destinos.length) return;
  indiceAtual = indice;
  const destino = estado.destinos[indice];
  fichaVazia.hidden = true;
  campos.hidden = false;
  el('#titulo-ficha').textContent = texto(destino.nome) || 'Novo destino';
  const pegar = (nome) => form.querySelector(`[name="${nome}"]`);
  pegar('nome').value = texto(destino.nome);
  pegar('id').value = texto(destino.id);
  pegar('regiao').value = texto(destino.regiao);
  pegar('selo').value = texto(destino.selo);
  pegar('resumo').value = texto(destino.resumo);
  pegar('descricao').value = texto(destino.descricao);
  pegar('estilo').value = texto(destino.estilo);
  pegar('descoberta').value = texto(destino.descoberta);
  pegar('imagem').value = texto(destino.imagem);
  pegar('imagemAlt').value = texto(destino.imagemAlt);
  pegar('icone').value = ICONES.some(([valor]) => valor === destino.icone) ? destino.icone : 'camera';
  desenharCategorias(destino.categorias || []);
  pegar('calendarioTitulo').value = destino.calendario?.titulo ?? CALENDARIO.titulo;
  pegar('calendarioConfirmado').value = destino.calendario?.confirmado ?? CALENDARIO.confirmado;
  pegar('calendarioPendente').value = destino.calendario?.pendente ?? CALENDARIO.pendente;
  form.querySelectorAll('[name="categorias"]').forEach(box => {
    box.checked = Array.isArray(destino.categorias) && destino.categorias.includes(box.value);
  });
  desenharLinhas('atracoes', listaTexto(destino.atracoes), { placeholderA: 'Ex.: As praias e o mar de Búzios' });
  desenharGaleria(Array.isArray(destino.galeria) ? destino.galeria : []);
  desenharLinhas('levar', listaTexto(destino.levar), { placeholderA: 'Ex.: Protetor solar' });
  desenharPerguntas(Array.isArray(destino.perguntas) ? destino.perguntas : []);
  desenharRoteiro(Array.isArray(destino.roteiro) && destino.roteiro.length ? destino.roteiro : ROTEIRO_PADRAO());
  atualizarPreview();
  limparErros();
  form.querySelectorAll('[aria-invalid="true"]').forEach(campo => campo.removeAttribute('aria-invalid'));
  desenharLista();
}

function desenharLinhas(chave, valores, opcoes = {}) {
  el(`#${chave}`).textContent = '';
  valores.forEach(valor => adicionarLinha(chave, valor, opcoes));
}

function adicionarLinha(chave, valor, opcoes = {}) {
  const alvo = el(`#${chave}`);
  const entrada = criar('input', { type: 'text', value: valor ?? '', placeholder: opcoes.placeholderA ?? '' });
  alvo.append(criar('div', { class: 'linha unica' }, [
    entrada,
    criar('button', { class: 'remover', type: 'button', title: 'Remover', 'aria-label': 'Remover item', texto: '×', onclick: (evento) => { evento.target.closest('.linha').remove(); marcarAlteracao(); } }),
  ]));
}

function desenharGaleria(fotos) {
  el('#galeria').textContent = '';
  fotos.forEach(foto => adicionarFoto(foto));
}

function adicionarFoto(foto = {}) {
  const imagem = criar('input', { type: 'text', value: texto(foto.imagem), placeholder: 'nome-do-arquivo' });
  const legenda = criar('input', { type: 'text', value: texto(foto.legenda), placeholder: 'Legenda da foto' });
  el('#galeria').append(criar('div', { class: 'linha' }, [
    imagem,
    legenda,
    criar('button', { class: 'remover', type: 'button', title: 'Remover foto', 'aria-label': 'Remover foto', texto: '×', onclick: (evento) => { evento.target.closest('.linha').remove(); marcarAlteracao(); } }),
  ]));
}

function desenharPerguntas(perguntas) {
  el('#perguntas').textContent = '';
  perguntas.forEach(pergunta => adicionarPergunta(pergunta));
}

function adicionarPergunta(item = {}) {
  const enunciado = criar('input', { type: 'text', value: texto(item.pergunta), placeholder: 'Pergunta do visitante' });
  const resposta = criar('input', { type: 'text', value: texto(item.resposta), placeholder: 'Resposta confirmada pela Fran' });
  el('#perguntas').append(criar('div', { class: 'linha' }, [
    enunciado,
    resposta,
    criar('button', { class: 'remover', type: 'button', title: 'Remover pergunta', 'aria-label': 'Remover pergunta', texto: '×', onclick: (evento) => { evento.target.closest('.linha').remove(); marcarAlteracao(); } }),
  ]));
}

/* --------------------------------- roteiro -------------------------------- */

const ROTEIRO_PADRAO = () => ([
  { horario: null, titulo: 'Encontro e embarque', descricao: 'Ponto de encontro e horário a combinar com a Fran.' },
  { horario: null, titulo: 'Hora de descobrir o destino', descricao: 'Inspiração: descreva o que o visitante pode conhecer. As atrações efetivas serão confirmadas no roteiro.' },
  { horario: null, titulo: 'Pausa para o almoço', descricao: 'Confirme a parada, as opções de alimentação e se a refeição está incluída no valor.' },
  { horario: null, titulo: 'Volta para casa', descricao: 'Previsão de retorno e desembarque a confirmar com a equipe.' },
]);

function desenharRoteiro(etapas) {
  el('#roteiro').textContent = '';
  etapas.forEach(etapa => adicionarEtapa(etapa));
}

function adicionarEtapa(etapa = {}) {
  const horario = criar('input', { type: 'time', class: 'horario', value: texto(etapa.horario), 'aria-label': 'Horário desta etapa (opcional)' });
  const titulo = criar('input', { type: 'text', value: texto(etapa.titulo), placeholder: 'Título da etapa' });
  const descricao = criar('input', { type: 'text', value: texto(etapa.descricao), placeholder: 'O que acontece nesta etapa' });
  el('#roteiro').append(criar('div', { class: 'linha roteiro-linha' }, [
    horario,
    titulo,
    descricao,
    criar('button', { class: 'remover', type: 'button', title: 'Remover etapa', 'aria-label': 'Remover etapa', texto: '×', onclick: (evento) => { evento.target.closest('.linha').remove(); marcarAlteracao(); } }),
  ]));
}

function atualizarPreview() {
  const destino = estado.destinos[indiceAtual];
  const preview = el('#preview-principal');
  const caminho = urlImagem(form.querySelector('[name="imagem"]').value);
  if (!caminho) {
    preview.removeAttribute('src');
    preview.classList.add('vazia');
    preview.alt = 'Nenhuma foto escolhida';
    return;
  }
  preview.classList.remove('vazia');
  preview.alt = `Prévia de ${texto(destino?.nome) || 'destino'}`;
  preview.src = `${caminho}?v=${Date.now()}`;
}

/* ------------------------------ ler o formulário -------------------------- */

function lerFormulario() {
  const valor = (nome) => texto(form.querySelector(`[name="${nome}"]`).value);
  const destino = {
    id: valor('id') || slug(valor('nome')),
    nome: valor('nome'),
    regiao: valor('regiao'),
    categorias: [...form.querySelectorAll('[name="categorias"]:checked')].map(box => box.value),
    calendario: { titulo: valor('calendarioTitulo') || CALENDARIO.titulo, confirmado: valor('calendarioConfirmado') || CALENDARIO.confirmado, pendente: valor('calendarioPendente') || CALENDARIO.pendente },
    selo: valor('selo'),
    icone: valor('icone'),
    resumo: valor('resumo'),
    descricao: valor('descricao'),
    atracoes: [...el('#atracoes').querySelectorAll('input')].map(campo => texto(campo.value)).filter(Boolean),
    imagem: valor('imagem').replace(/^\/?images\//, ''),
    imagemAlt: valor('imagemAlt'),
    estilo: valor('estilo'),
    descoberta: valor('descoberta'),
    galeria: [...el('#galeria').querySelectorAll('.linha')].map(linha => {
      const [imagem, legenda] = linha.querySelectorAll('input');
      return { imagem: texto(imagem.value).replace(/^\/?images\//, ''), legenda: texto(legenda.value) };
    }).filter(foto => foto.imagem || foto.legenda),
    levar: [...el('#levar').querySelectorAll('input')].map(campo => texto(campo.value)).filter(Boolean),
    perguntas: [...el('#perguntas').querySelectorAll('.linha')].map(linha => {
      const [pergunta, resposta] = linha.querySelectorAll('input');
      return { pergunta: texto(pergunta.value), resposta: texto(resposta.value) };
    }).filter(item => item.pergunta || item.resposta),
    roteiro: [...el('#roteiro').querySelectorAll('.roteiro-linha')].map(linha => {
      const [horario, titulo, descricao] = linha.querySelectorAll('input');
      return { horario: texto(horario.value) || null, titulo: texto(titulo.value), descricao: texto(descricao.value) };
    }).filter(etapa => etapa.titulo || etapa.descricao),
  };
  return destino;
}

function validar(destino, indice) {
  const problemas = [];
  if (!destino.nome) { problemas.push('Informe o nome do destino.'); marcarInvalido('nome'); }
  if (!destino.id) { problemas.push('Informe o identificador do link.'); marcarInvalido('id'); }
  else if (!/^[a-z0-9][a-z0-9-]*$/.test(destino.id)) { problemas.push('O identificador deve usar apenas letras minúsculas, números e hífen (ex.: arraial-do-cabo).'); marcarInvalido('id'); }
  else if (estado.destinos.some((outro, posicao) => posicao !== indice && texto(outro.id) === destino.id)) { problemas.push(`Já existe outro destino com o identificador “${destino.id}”.`); marcarInvalido('id'); }
  if (!destino.regiao) { problemas.push('Informe a região.'); marcarInvalido('regiao'); }
  if (!destino.resumo) { problemas.push('Escreva o resumo que aparece no cartão.'); marcarInvalido('resumo'); }
  if (!destino.descricao) { problemas.push('Escreva a descrição completa.'); marcarInvalido('descricao'); }
  if (!destino.imagem) { problemas.push('Informe o nome do arquivo da foto principal.'); marcarInvalido('imagem'); }
  if (!destino.categorias.length) problemas.push('Marque pelo menos uma categoria.');
  destino.galeria.forEach((foto, numero) => {
    if (!foto.imagem) problemas.push(`A foto nº ${numero + 1} da galeria está sem o nome do arquivo.`);
    else if (!foto.legenda) problemas.push(`A foto nº ${numero + 1} da galeria está sem legenda.`);
  });
  destino.perguntas.forEach((item, numero) => {
    if (!item.pergunta) problemas.push(`A pergunta nº ${numero + 1} está sem enunciado.`);
    if (!item.resposta) problemas.push(`A pergunta nº ${numero + 1} está sem resposta.`);
  });
  destino.roteiro.forEach((etapa, numero) => {
    if (!etapa.titulo) problemas.push(`A etapa nº ${numero + 1} do roteiro está sem título.`);
    if (!etapa.descricao) problemas.push(`A etapa nº ${numero + 1} do roteiro está sem descrição.`);
  });
  return problemas;
}

function marcarInvalido(nome) {
  const campo = form.querySelector(`[name="${nome}"]`);
  if (campo) campo.setAttribute('aria-invalid', 'true');
}

function limparErros() {
  el('#erros').hidden = true;
  el('#erros').textContent = '';
}

function mostrarErros(problemas) {
  const caixa = el('#erros');
  caixa.textContent = '';
  caixa.append(criar('strong', { texto: problemas.length === 1 ? 'Corrija o item abaixo antes de salvar:' : 'Corrija os itens abaixo antes de salvar:' }));
  const lista = criar('ul');
  problemas.forEach(problema => lista.append(criar('li', { texto: problema })));
  caixa.append(lista);
  caixa.hidden = false;
}

/* --------------------------------- gravação -------------------------------- */

function guardarAtual() {
  const destino = lerFormulario();
  const problemas = validar(destino, indiceAtual);
  form.querySelectorAll('[aria-invalid="true"]').forEach(campo => { campo.removeAttribute('aria-invalid'); });
  const problemasRevalidados = problemas.length ? validar(destino, indiceAtual) : [];
  if (problemasRevalidados.length) {
    mostrarErros(problemasRevalidados);
    avisar('erro', 'Alguns campos precisam de atenção.');
    const primeiro = form.querySelector('[aria-invalid="true"]');
    if (primeiro) primeiro.focus();
    return false;
  }
  estado.destinos[indiceAtual] = destino;
  el('#titulo-ficha').textContent = destino.nome;
  desenharLista();
  limparErros();
  return true;
}

let gravando = false;
async function gravar() {
  if (gravando) return;
  gravando = true;
  form.inert = true;
  el('.lista').inert = true;
  el('#novo').disabled = true;
  el('#salvar').disabled = true;
  el('#salvar').textContent = 'Salvando…';
  try { await gravarConteudo(); }
  finally {
    gravando = false;
    form.inert = false;
    el('.lista').inert = false;
    el('#novo').disabled = false;
    el('#salvar').disabled = false;
    el('#salvar').textContent = 'Salvar alterações';
    form.querySelector('[aria-invalid="true"]')?.focus();
  }
}
async function gravarConteudo() {
  if (indiceAtual >= 0 && !guardarAtual()) return;
  for (let i = 0; i < estado.destinos.length; i++) {
    const d = estado.destinos[i];
    const completo = { ...d, categorias: d.categorias || [], galeria: d.galeria || [], perguntas: d.perguntas || [], roteiro: d.roteiro || [] };
    if (validar(completo, i).length) {
      selecionar(i);
      guardarAtual();
      return;
    }
  }

  const conteudo = `${JSON.stringify(conteudoArquivo(), null, 2)}\n`;

  // 1) Caminho preferido: o servidor local grava direto em public/destinos.json.
  if (gravacaoDireta) {
    try {
      const resposta = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: conteudo });
      const resultado = await resposta.json().catch(() => null);
      if (!resposta.ok || resultado?.gravado !== true) throw new Error(resultado?.erro ?? String(resposta.status));
      salvoJSON = JSON.stringify(estado);
      trocou = false;
      atualizarStatus();
      avisar('ok', `public/destinos.json atualizado (uma cópia do arquivo anterior ficou em public/). Agora rode “npm run atualizar” no terminal e envie a pasta dist para a hospedagem.`);
    } catch (erro) {
      avisar('erro', `Não foi possível gravar public/destinos.json: ${erro instanceof Error ? erro.message : 'erro desconhecido'}. Nada foi publicado; confira o Terminal onde o servidor está rodando.`);
    }
    return;
  }

  // 2) Sem o servidor local: tenta gravar sobre o arquivo escolhido.
  if (await gravarNoArquivoEscolhido(conteudo)) return;

  // 3) Último recurso: baixa o arquivo para substituir o de public/.
  const arquivo = new Blob([conteudo], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(arquivo);
  link.download = ARQUIVO;
  link.click();
  URL.revokeObjectURL(link.href);
  salvoJSON = JSON.stringify(estado);
  trocou = false;
  atualizarStatus();
  avisar('info', `O navegador baixou ${ARQUIVO} na pasta de downloads. Mova esse arquivo para ${CAMINHO_NO_PROJETO}, substituindo o que está lá, e rode “npm run atualizar”. Dica: rode “npm run editor” e o botão salva direto no projeto.`);
}

/**
 * Grava sobre um arquivo escolhido pela pessoa. Depois de escrever, confere o
 * que ficou no disco: se o arquivo não for o do projeto, avisa para não deixar
 * a impressão de que o site foi atualizado.
 */
async function gravarNoArquivoEscolhido(conteudo) {
  try {
    if (!fileHandle && window.showSaveFilePicker) {
      avisar('info', 'Escolha o arquivo destinos.json que está dentro da pasta public do projeto.');
      fileHandle = await window.showSaveFilePicker({
        suggestedName: ARQUIVO,
        types: [{ description: 'Arquivo de conteúdo do site', accept: { 'application/json': ['.json'] } }],
      });
    }
    if (!fileHandle) return false;
    const escrita = await fileHandle.createWritable();
    await escrita.write(conteudo);
    await escrita.close();
    const conferido = await (await fileHandle.getFile()).text();
    if (conferido.trim() !== conteudo.trim()) {
      avisar('erro', 'O arquivo gravado não parece ser o destinos.json do projeto. Nada mudou no site. Rode “npm run editor” para gravar direto em public/destinos.json.');
      fileHandle = null;
      return true;
    }
    salvoJSON = JSON.stringify(estado);
    trocou = false;
    atualizarStatus();
    avisar('ok', `${ARQUIVO} atualizado. Agora rode “npm run atualizar” no terminal e envie a pasta dist para a hospedagem.`);
    return true;
  } catch (erro) {
    if (erro && erro.name === 'AbortError') return true;
    fileHandle = null;
    return false;
  }
}

/** Mantém o formato do arquivo: schema (quando existir) + lista de destinos. */
function conteudoArquivo() {
  const conteudo = {};
  if (estado.schema) conteudo.$schema = estado.schema;
  conteudo.destinos = estado.destinos.map(destino => {
    const limpo = {};
    const ordem = ['id', 'nome', 'regiao', 'categorias', 'selo', 'icone', 'resumo', 'descricao', 'atracoes', 'imagem', 'imagemAlt', 'estilo', 'descoberta', 'galeria', 'levar', 'roteiro', 'perguntas'];
    ordem.forEach(chave => {
      const valor = destino[chave];
      if (Array.isArray(valor)) { if (valor.length) limpo[chave] = valor; return; }
      if (typeof valor === 'string' && valor.trim()) limpo[chave] = valor.trim();
    });
    if (destino.calendario) limpo.calendario = destino.calendario;
    return limpo;
  });
  return conteudo;
}

function filtrarLista() {
  const busca = slug(el('#buscar').value);
  let visiveis = 0;
  [...el('#lista-destinos').children].forEach((item, indice) => {
    const destino = estado.destinos[indice];
    item.hidden = !slug(`${destino.nome} ${destino.regiao}`).includes(busca);
    if (!item.hidden) visiveis++;
  });
  el('#sem-resultados').hidden = visiveis > 0 || !estado.destinos.length;
}
function atualizarStatus() {
  el('#estado-salvo').textContent = trocou ? 'Alterações não salvas' : gravacaoDireta ? 'Conteúdo salvo no computador' : 'Modo de exportação: confira o arquivo no projeto';
}
function marcarAlteracao() {
  if (indiceAtual >= 0) estado.destinos[indiceAtual] = lerFormulario();
  el('#titulo-ficha').textContent = estado.destinos[indiceAtual]?.nome || 'Novo destino';

  if (!trocou) {
    trocou = true;
    avisar('info', mensagemGravacao());
  }
  atualizarStatus();
}

/* --------------------------------- eventos -------------------------------- */

form.addEventListener('input', (evento) => {
  if (evento.target.name === 'imagem') atualizarPreview();
  if (['nome', 'id', 'regiao'].includes(evento.target.name)) atualizarRotulo(indiceAtual);
  marcarAlteracao();
});

form.addEventListener('click', (evento) => {
  const adicionar = evento.target.closest('[data-add]');
  if (!adicionar) return;
  const chave = adicionar.dataset.add;
  if (chave === 'galeria') adicionarFoto();
  else if (chave === 'perguntas') adicionarPergunta();
  else if (chave === 'roteiro') adicionarEtapa();
  else adicionarLinha(chave, '');
  marcarAlteracao();
});

el('#novo').addEventListener('click', novoDestino);
el('#novo-2').addEventListener('click', novoDestino);
el('#salvar').addEventListener('click', gravar);
el('#salvar-2').addEventListener('click', gravar);
el('#descartar').addEventListener('click', () => {
  try {
    estado = JSON.parse(salvoJSON);
  } catch { return; }
  desenharLista();
  if (estado.destinos.length) selecionar(Math.max(0, Math.min(indiceAtual, estado.destinos.length - 1)));
  trocou = false;
  atualizarStatus();  limparErros();
  avisar('info', 'Alterações não salvas foram desfeitas.');
});
el('#ajuda').addEventListener('click', (evento) => {
  const painel = el('#ajuda-painel');
  painel.hidden = !painel.hidden;
  evento.currentTarget.setAttribute('aria-expanded', String(!painel.hidden));
});

const dialogo = el('#dialog-excluir');
el('#excluir').addEventListener('click', () => {
  if (indiceAtual < 0) return;
  el('#nome-excluir').textContent = texto(estado.destinos[indiceAtual].nome) || 'este destino';
  dialogo.showModal();
});
el('#cancelar-excluir').addEventListener('click', () => dialogo.close());
el('#confirmar-excluir').addEventListener('click', () => {
  if (indiceAtual < 0) return;
  const removido = estado.destinos.splice(indiceAtual, 1)[0];
  dialogo.close();
  if (!estado.destinos.length) {
    indiceAtual = -1;
    campos.hidden = true;
    fichaVazia.hidden = false;
  } else selecionar(Math.min(indiceAtual, estado.destinos.length - 1));
  desenharLista();
  marcarAlteracao();
  avisar('info', `“${texto(removido?.nome) || 'Destino'}” saiu da lista. Clique em “Salvar alterações” para gravar.`);
});

function novoDestino() {
  // Destino novo entra no começo da lista: é a primeira posição do site e do arquivo.
  estado.destinos.unshift({ id: '', nome: '', regiao: '', categorias: [], selo: '', icone: 'camera', resumo: '', descricao: '', atracoes: [], imagem: '', imagemAlt: '', estilo: '', descoberta: '', galeria: [], levar: [], perguntas: [], roteiro: ROTEIRO_PADRAO() });
  el('#buscar').value = '';
  selecionar(0);
  marcarAlteracao();
  avisar('info', 'Destino novo criado na primeira posição. Preencha os campos e clique em “Salvar alterações”.');
  form.querySelector('[name="nome"]').focus();
}

window.addEventListener('beforeunload', (evento) => {
  if (trocou) {
    evento.preventDefault();
    evento.returnValue = '';
  }
});

/* ---------------------------------- início -------------------------------- */

el('#icone').append(...ICONES.map(([valor, rotulo]) => criar('option', { value: valor, texto: rotulo })));
el('#buscar').addEventListener('input', filtrarLista);
form.addEventListener('submit', evento => evento.preventDefault());
[...campos.querySelectorAll(':scope > fieldset')].forEach((secao, i) => {
  secao.id = `secao-${i}`;
  el('#secoes').append(criar('a', { href: `#${secao.id}`, texto: secao.querySelector('legend').textContent }));
});
el('#adicionar-categoria').addEventListener('click', () => {
  const input = el('#categoria-nova');
  const nome = texto(input.value);
  if (!nome || nome === 'all') { input.focus(); avisar('erro', 'Digite um nome de categoria. O nome all é reservado.'); return; }
  const existentes = [...el('#opcoes-categorias').querySelectorAll('input')];
  const valor = existentes.find(c => slug(CATEGORIAS.get(c.value) || c.value) === slug(nome))?.value || nome;
  desenharCategorias([...new Set([...existentes.filter(c => c.checked).map(c => c.value), valor])]);
  input.value = '';
  marcarAlteracao();
});
void carregar();
