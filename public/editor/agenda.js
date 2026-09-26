import { validarAgenda } from './agenda-validation.js';
const form = document.querySelector('#agenda-form');
const lista = document.querySelector('#agenda-itens');
const status = document.querySelector('#agenda-status');
const novo = document.querySelector('#nova-saida');
const salvar = document.querySelector('#salvar-agenda');
const api = '/__conteudo__/destinos?arquivo=passeios.json';
let saidas = [], destinos = [], pendente = false;
const informar = texto => { status.textContent = texto; };
const alterar = () => { pendente = true; informar('Agenda com alterações não salvas. Clique em Salvar agenda.'); };
function campo(label, tipo, valor, mudar) {
  const rotulo = document.createElement('label');
  rotulo.textContent = label;
  const input = document.createElement('input');
  input.type = tipo; input.value = valor ?? '';
  if (tipo === 'number') { input.min = '0'; input.step = '0.01'; }
  input.addEventListener('input', () => { mudar(input.value); alterar(); });
  rotulo.append(input);
  return rotulo;
}
function desenhar() {
  lista.replaceChildren();
  saidas.forEach((saida, i) => {
    const ficha = document.createElement('fieldset');
    const legenda = document.createElement('legend'); legenda.textContent = `Saída ${i + 1}`;
    const label = document.createElement('label'); label.textContent = 'Destino';
    const select = document.createElement('select');
    select.add(new Option('Selecione um destino', ''));
    destinos.forEach(d => select.add(new Option(d.nome, d.id)));
    select.value = saida.destinationId;
    select.addEventListener('change', () => { saida.destinationId = select.value; alterar(); }); label.append(select);
    const remover = document.createElement('button'); remover.type = 'button'; remover.className = 'btn btn-danger btn-small'; remover.textContent = 'Remover saída';
    remover.addEventListener('click', () => { if (confirm(`Remover a saída “${saida.title || 'Sem título'}”? A remoção será gravada ao salvar a agenda.`)) { saidas.splice(i, 1); desenhar(); alterar(); } });
    ficha.append(legenda, label,
      campo('Título do passeio', 'text', saida.title, v => saida.title = v),
      campo('Data confirmada (opcional)', 'date', saida.date, v => { saida.date = v || null; }),
      campo('Local de embarque (opcional)', 'text', saida.departure, v => saida.departure = v.trim() || null),
      campo('Preço por pessoa em R$ (opcional)', 'number', saida.price, v => saida.price = v === '' ? null : Number(v)), remover);
    if (saida.startsAt || saida.endsAt) {
      const nota = document.createElement('p'); nota.className = 'muted'; nota.textContent = 'Esta saída tem horários detalhados cadastrados. Ao mudar a data, eles serão removidos e o calendário usará um lembrete de dia inteiro.'; ficha.append(nota);
    }
    lista.append(ficha);
  });
  if (!saidas.length) lista.textContent = 'Nenhuma saída cadastrada. Clique em Nova saída para começar.';
}
let datasOriginais = new Map();
async function ler(url) { const r = await fetch(url, { cache: 'no-cache' }); if (!r.ok) throw Error('Falha ao carregar o conteúdo.'); return r.json(); }
try {
  const [agenda, catalogo, servidor] = await Promise.all([ler('../passeios.json'), ler('../destinos.json'), ler('/__conteudo__/disponivel')]);
  if (!Array.isArray(agenda) || !Array.isArray(catalogo.destinos) || !servidor.disponivel) throw Error('Abra o painel com npm run editor.');
  saidas = agenda; destinos = catalogo.destinos;
  datasOriginais = new Map(saidas.map(s => [s.id, s.date]));
  desenhar(); novo.disabled = false; salvar.disabled = false;
  informar(`${saidas.length} saídas carregadas. Datas e preços em branco ainda não foram confirmados.`);
} catch (erro) { informar(`Não foi possível abrir a agenda. ${erro.message} Recarregue o editor para tentar novamente.`); }
novo.addEventListener('click', async () => {
  novo.disabled = true;
  try {
    destinos = (await ler('../destinos.json')).destinos;
    saidas.push({ id: `saida-${crypto.randomUUID()}`, destinationId: '', title: '', date: null, departure: null, price: null });
    desenhar(); alterar(); lista.lastElementChild?.querySelector('select')?.focus();
  } catch { informar('Não foi possível atualizar os destinos. Tente novamente.'); }
  finally { novo.disabled = false; }
});
form.addEventListener('submit', async evento => {
  evento.preventDefault();
  if (!form.reportValidity()) return;
  form.inert = true;
  try {
    destinos = (await ler('../destinos.json')).destinos;
    const erros = validarAgenda(saidas, destinos);
    if (erros.length) { informar(erros.join(' ')); return; }
    const dados = saidas.map(s => {
      const copia = { ...s, title: s.title.trim() };
      if (datasOriginais.has(s.id) && datasOriginais.get(s.id) !== s.date) { delete copia.startsAt; delete copia.endsAt; }
      return copia;
    });
    const resposta = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dados, null, 2) + '\n' });
    const resultado = await resposta.json();
    if (!resposta.ok || !resultado.gravado) throw Error(resultado.erro || 'Falha na gravação.');
    saidas = dados; datasOriginais = new Map(saidas.map(s => [s.id, s.date])); pendente = false; desenhar();
    informar(`Agenda salva: ${saidas.length} saídas. Confira o site, rode npm run atualizar e envie o conteúdo de dist.`);
  } catch (erro) { informar(`Não foi possível salvar a agenda: ${erro.message}`); }
  finally { form.inert = false; }
});
window.addEventListener('beforeunload', evento => { if (pendente) { evento.preventDefault(); evento.returnValue = ''; } });
