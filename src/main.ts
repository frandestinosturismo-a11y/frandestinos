import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/playfair-display/500-italic.css';
import './style.css';
import { mountTravelDetails, refreshTravelDetails, setupTravelDetails } from './travel-details';
import { cardActions, consultation, setupExperience } from './experience';
import { createIcons, ArrowUpRight, ArrowRight, ArrowDown, MapPin, CalendarDays, Heart, Menu, X, Mountain, Waves, Landmark, Coffee, Camera, Sun, ChevronDown, ChevronLeft, ChevronRight, MessageCircle, Send, Check, Compass, Route, Sparkles, Quote, Users, Search, Clock, Bus, Plus, Info, Instagram, Facebook, ArrowUp, Columns2, Share2, Expand, Wallet, Footprints, Accessibility, Backpack, Download } from 'lucide';
import { destinations, whatsapp, escapeHtml as esc, type Tour, type Testimonial } from './data';
import { destinationImage, loadCatalog, categoryOptions, type Category } from './catalog';
import './editorial.css';
const icon = (name: string, cls = '') => `<i data-lucide="${name}" class="${cls}" aria-hidden="true"></i>`;
const waIcon = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.5 3.5A11.9 11.9 0 0 0 12 0C5.4 0 .1 5.3.1 11.9c0 2.1.6 4.2 1.6 6L0 24l6.3-1.6c1.8 1 3.7 1.5 5.7 1.5 6.6 0 11.9-5.3 11.9-11.9 0-3.2-1.2-6.2-3.4-8.5ZM12 21.9c-1.8 0-3.6-.5-5.1-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.9 9.9 0 0 1 2.1 12 9.9 9.9 0 0 1 12 2.1 9.9 9.9 0 0 1 21.9 12a9.9 9.9 0 0 1-9.9 9.9Zm5.4-7.4c-.3-.1-1.8-.9-2.1-1-.3-.1-.5-.1-.7.2s-.8 1-.9 1.1c-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.6.3-.5c.1-.2 0-.4 0-.5l-1-2.3c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.2 5 4.5.7.3 1.3.5 1.7.6.7.2 1.3.2 1.8.1.6-.1 1.8-.7 2.1-1.5.3-.7.3-1.4.2-1.5-.1-.1-.3-.2-.6-.3Z"/></svg>`;
const icons = () => createIcons({ icons: { ArrowUpRight, ArrowRight, ArrowDown, MapPin, CalendarDays, Heart, Menu, X, Mountain, Waves, Landmark, Coffee, Camera, Sun, ChevronDown, ChevronLeft, ChevronRight, MessageCircle, Send, Check, Compass, Route, Sparkles, Quote, Users, Search, Clock, Bus, Plus, Info, Instagram, Facebook, ArrowUp, Columns2, Share2, Expand, Wallet, Footprints, Accessibility, Backpack, Download } });
const waLink = (label: string, cls = 'button button-orange', message?: string) => `<a class="${cls}" href="${whatsapp(message)}" target="_blank" rel="noopener noreferrer">${waIcon}${label}</a>`;
const brand = `<img src="/images/fran-turismo-logo.png" width="60" height="60" alt="Logo Fran Turismo" /><span class="brand-type">Fran<span>TURISMO</span></span>`;

// O conteúdo vem de public/destinos.json. Carregamos antes de montar a página
// para que listas, agenda e detalhes usem exatamente o que está no arquivo.
const catalogo = await loadCatalog();

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<a class="skip-link" href="#destinos">Pular para o conteúdo</a>
<div class="topline"><div class="container"><span>${icon('sun')} Um Rio de possibilidades espera por você.</span><a href="${whatsapp()}" target="_blank" rel="noopener noreferrer">Vamos planejar seu próximo passeio? ${icon('arrow-up-right')}</a></div></div>
<header class="site-header"><div class="container header-inner"><a class="brand" href="#inicio" aria-label="Fran Turismo — início">${brand}</a><nav id="main-nav" aria-label="Navegação principal"><a href="#destinos">Destinos</a><a href="#agenda">Próximos passeios</a><a href="#sobre">A Fran Turismo</a><a href="#depoimentos">Depoimentos</a></nav>${waLink('Fale com a Fran', 'button button-navy header-contact')}<button class="menu-toggle" aria-expanded="false" aria-controls="main-nav" aria-label="Abrir menu">${icon('menu')}</button></div></header>
<main>
<section id="inicio" class="hero"><img class="hero-image" src="/images/rio.jpg" alt="Cristo Redentor com a Baía de Guanabara e o Pão de Açúcar ao fundo" width="1920" height="1025" fetchpriority="high" /><div class="hero-shade"></div><div class="container hero-content"><span class="eyebrow light"><span class="tiny-line"></span> VIVA O RIO. COLECIONE HISTÓRIAS.</span><h1>O próximo destino<br>é uma boa<br><em>memória.</em></h1><p>Da serra ao mar, descubra lugares incríveis<br class="desktop-break"> e viva momentos que ficam com você.</p><a class="button button-orange" href="#destinos">Encontre seu próximo passeio ${icon('arrow-up-right')}</a><div class="hero-note">${icon('heart')} Novos lugares. Boas companhias. Histórias para contar.</div></div><div class="hero-location">${icon('map-pin')}<span>Rio de Janeiro, Brasil<small>O nosso ponto de partida para se encantar.</small></span></div><a href="#destinos" class="hero-scroll" aria-label="Explorar destinos">${icon('arrow-down')}</a></section>
<div class="container finder-wrap"><form id="trip-finder" class="trip-finder"><div class="finder-intro">Sua próxima pausa<br><strong>começa aqui.</strong></div><label class="finder-field">${icon('map-pin')}<span><span class="field-label">PARA ONDE VAMOS?</span><select id="finder-destination" aria-label="Escolha seu destino"><option value="all">Escolha seu destino</option>${destinations.map(d => `<option value="${d.id}">${d.nome}</option>`).join('')}</select></span>${icon('chevron-down')}</label><label class="finder-field">${icon('users')}<span><span class="field-label">DO SEU JEITO</span><select id="finder-company" aria-label="Com quem você vai viajar"><option value="Ainda estou decidindo">Ainda estou decidindo</option><option value="Vou por conta própria">Vou por conta própria</option><option value="Vou em casal">Vou em casal</option><option value="Vou com a família">Vou com a família</option><option value="Vou com amigos">Vou com amigos</option></select></span>${icon('chevron-down')}</label><button class="button button-navy" type="submit">Explorar passeios ${icon('search')}</button></form></div>
<section class="intro-strip container" aria-label="Descubra a Fran Turismo"><span>${icon('compass')} Destinos para se apaixonar</span><span>${icon('message-circle')} Atendimento próximo de você</span><span>${icon('heart')} Mais momentos, boas memórias</span></section>
<section class="travel-editorial container" aria-labelledby="editorial-title">
  <div class="editorial-running-head"><span>O CADERNO DE VIAGENS DA FRAN</span><span>RIO DE JANEIRO · BRASIL</span></div>
  <div class="editorial-heading"><div><span class="eyebrow">UM ESTADO. TANTAS DESCOBERTAS.</span><h2 id="editorial-title">Mude a paisagem.<br>Renove as <em>histórias.</em></h2></div><p>Entre o verde da serra e o azul do mar,<br> sempre existe um lugar para se encantar.</p></div>
  <div class="editorial-mosaic">
    <button class="editorial-scene scene-serra" data-destination="teresopolis" aria-label="Descobrir Teresópolis"><img src="/images/teresopolis.jpg" alt="Montanhas da Serra dos Órgãos sob o céu azul" loading="lazy" width="960" height="640"/><span class="scene-index" aria-hidden="true">01 / RESPIRAR</span><span class="scene-copy"><small>TERESÓPOLIS · REGIÃO SERRANA</small><strong>Um respiro.<br>Um novo horizonte.</strong><span>Encontre a sua pausa ${icon('arrow-up-right')}</span></span></button>
    <button class="editorial-scene scene-charme" data-destination="penedo" aria-label="Descobrir Penedo"><img src="/images/penedo.jpg" alt="Casinhas coloridas e ponte na Pequena Finlândia de Penedo" loading="lazy" width="960" height="540"/><span class="scene-index" aria-hidden="true">02 / SABOREAR</span><span class="scene-copy"><small>PENEDO · SERRA DA MANTIQUEIRA</small><strong>A beleza dos<br>pequenos momentos.</strong><span>Conheça esse charme ${icon('arrow-up-right')}</span></span></button>
    <button class="editorial-scene scene-mar" data-destination="paraty" aria-label="Descobrir Paraty"><img src="/images/paraty.jpg" alt="Igreja de Santa Rita à beira-mar em Paraty" loading="lazy" width="902" height="602"/><span class="scene-index" aria-hidden="true">03 / DESCOBRIR</span><span class="scene-copy"><small>PARATY · COSTA VERDE</small><strong>Onde a história<br>encontra o mar.</strong><span>Deixe-se levar ${icon('arrow-up-right')}</span></span></button>
    <div class="editorial-stamp" aria-hidden="true"><span>FRAN TURISMO</span>${icon('compass')}<strong>vá viver</strong><span>BOAS HISTÓRIAS</span></div>
  </div>
  <div class="editorial-route" aria-hidden="true"><span>${icon('mountain')} Serra</span><span class="route-trail"></span><span>${icon('coffee')} Charme</span><span class="route-trail"></span><span>${icon('waves')} Mar</span><em>O caminho também faz parte.</em></div>
</section>
<section id="destinos" class="section destinations-section"><div class="container"><div class="section-heading"><div><span class="eyebrow">SEU PRÓXIMO LUGAR FAVORITO</span><h2>Perto de casa.<br>Longe da <em>rotina.</em></h2></div><p>Um café na serra, uma brisa do mar,<br>uma descoberta pelo caminho.<br>Qual vai ser a sua próxima história?</p></div><div class="destinations-toolbar"><div class="filter-pills" role="group" aria-label="Filtrar destinos"><button class="filter-pill active" data-category="all" aria-pressed="true">Todos os destinos</button>${categoryOptions().map(c => `<button class="filter-pill" data-category="${esc(c.value)}" aria-pressed="false">${esc(c.label)}</button>`).join('')}</div><span class="small-note">Feito para o seu próximo “vamos?”</span></div><div id="destination-grid" class="destination-grid" aria-live="polite"></div><div class="center"><button id="show-all" class="text-button">Conhecer todos os destinos ${icon('arrow-right')}</button></div></div></section>
<section id="agenda" class="section agenda-section"><div class="container"><div class="section-heading"><div><span class="eyebrow">TIRE O PASSEIO DOS PLANOS</span><h2>Tem uma nova história<br>na sua <em>agenda.</em></h2></div><div class="agenda-heading-note">${icon('calendar-days')}<p>Escolha o destino.<br>A gente conversa sobre a próxima saída.</p></div></div><div class="agenda-layout"><div class="agenda-board"><div class="agenda-controls"><label><span class="sr-only">Filtrar agenda por destino</span><select id="agenda-destination"><option value="all">Todos os destinos</option>${destinations.map(d => `<option value="${d.id}">${d.nome}</option>`).join('')}</select></label><label><span class="sr-only">Filtrar agenda por mês</span><select id="agenda-month"><option value="all">Todos os meses</option><option value="pending">Datas a confirmar</option></select></label><button id="clear-agenda" class="text-button" hidden>Limpar</button></div><p class="agenda-status" id="agenda-status" role="status">Carregando a programação…</p><div id="tour-list"></div><p class="agenda-footnote">${icon('info')} Roteiros, valores e pontos de embarque são confirmados pelo WhatsApp.</p></div><aside class="agenda-aside"><div class="aside-icon">${icon('send')}</div><span class="eyebrow">VAMOS COMBINAR?</span><h3>A próxima viagem<br>pode começar com<br>um <em>“oi”.</em></h3><p>Conte para a Fran aonde você quer ir e consulte as próximas datas.</p>${waLink('Quero saber dos passeios', 'button button-orange')}<span class="aside-caption">Seu próximo destino está a uma conversa.</span><div class="aside-doodle" aria-hidden="true">↗</div></aside></div></div></section>
<section id="sobre" class="section about-section"><div class="container about-layout"><div class="about-visual"><img class="about-main" src="/images/paraty.jpg" alt="Casario histórico e Igreja de Santa Rita em Paraty" loading="lazy" width="902" height="602" /><div class="about-small"><img src="/images/penedo.jpg" alt="Arquitetura e paisagem de Penedo" loading="lazy" width="960" height="540" /></div><div class="round-stamp">${icon('heart')}<span>VIAJAR É<br>COLECIONAR<br><strong>momentos.</strong></span></div><span class="photo-caption">Tem tanta coisa linda logo ali…</span></div><div class="about-copy"><span class="eyebrow">PRAZER, SOMOS A FRAN TURISMO</span><h2>Viajar é bom.<br>Viajar junto é<br><em>ainda melhor.</em></h2><p>Acreditamos que um passeio vai muito além do destino. É a conversa no caminho, a foto espontânea e a vontade de fazer tudo de novo.</p><p>A Fran Turismo é um convite para sair da rotina, conhecer os encantos do Rio e dar espaço a novas histórias.</p><div class="about-features"><div>${icon('map-pin')}<span><strong>O Rio em cada detalhe</strong>Da Região Serrana à Costa Verde.</span></div><div>${icon('message-circle')}<span><strong>Conversa de verdade</strong>Fale diretamente com a Fran e tire suas dúvidas.</span></div><div>${icon('users')}<span><strong>Seu jeito de viajar</strong>Sozinho, a dois, em família ou com os amigos.</span></div></div><a href="${whatsapp('Olá, Fran! Quero conhecer melhor a Fran Turismo e planejar um passeio.')}" class="text-button" target="_blank" rel="noopener noreferrer">Vamos nos conhecer? ${icon('arrow-up-right')}</a></div></div></section>
<section id="depoimentos" class="section testimonials-section"><div class="container"><div class="testimonials-title"><span class="eyebrow">MEMÓRIAS QUE A GENTE LEVA</span><h2>A melhor parte da viagem?<br><em>As histórias de quem foi.</em></h2><p>O destino é só o começo. A experiência é o que fica.</p></div><div id="testimonials-content"></div><div class="testimonials-bottom"><span>${icon('heart')} Já viveu um momento especial com a Fran?</span>${waLink('Conte a sua experiência', 'text-button', 'Olá, Fran! Já viajei com a Fran Turismo e gostaria de compartilhar meu depoimento. Meu passeio foi para: \nMinha experiência: ')}</div></div></section>
<section class="section how-section"><div class="container"><div class="section-heading"><div><span class="eyebrow">SEM COMPLICAÇÃO, COM MUITA VONTADE</span><h2>Do “vamos?” ao <em>“partiu!”.</em></h2></div><p>O seu próximo passeio começa<br>em três passos simples.</p></div><div class="steps"><article><span class="step-number">01</span><div>${icon('compass')}<h3>Encontre seu destino</h3><p>Explore os lugares e escolha aquele que combina com seu momento.</p></div></article><article><span class="step-number">02</span><div>${icon('message-circle')}<h3>Converse com a Fran</h3><p>Consulte datas, valores, roteiro e todas as informações do passeio.</p></div></article><article><span class="step-number">03</span><div>${icon('bus')}<h3>Prepare as boas memórias</h3><p>Confirme sua reserva com a equipe e comece a contagem regressiva.</p></div></article></div></div></section>
<section class="section faq-section"><div class="container faq-layout"><div><span class="eyebrow">ANTES DE ARRUMAR A MALA</span><h2>Ficou com<br>alguma <em>dúvida?</em></h2><p>A Fran te ajuda a dar o primeiro passo.</p>${waLink('Vamos conversar', 'text-button')}</div><div class="faq-list">${[
 ['Como faço para reservar um passeio?', 'Escolha o destino e toque em “Consultar passeio”. Você será direcionado ao WhatsApp da Fran Turismo com uma mensagem pronta. A equipe informa disponibilidade, valores e os passos para confirmar sua reserva.'],
 ['De onde saem os passeios?', 'Os locais e horários de embarque variam conforme o passeio. Consulte a Fran pelo WhatsApp para saber o ponto de saída do roteiro que você escolheu.'],
 ['O que está incluído no valor?', 'Cada roteiro tem suas próprias condições. Antes de reservar, confirme com a equipe o transporte, as refeições, os ingressos e os demais itens incluídos no passeio.'],
 ['Posso viajar sozinho ou levar a família?', 'Conte para a Fran como você pretende viajar e quantas pessoas vão com você. A equipe orienta sobre o perfil do passeio, condições para crianças e eventuais necessidades de acessibilidade.'],
 ['Como funcionam o pagamento e o cancelamento?', 'As formas de pagamento, os prazos e as condições de cancelamento são informados pela equipe antes da confirmação da reserva. Peça essas informações ao consultar o passeio.']
].map(([q,a]) => `<details><summary>${q}${icon('plus')}</summary><p>${a}</p></details>`).join('')}</div></div></section>
<section class="final-cta container"><div><span class="eyebrow light">A ROTINA PODE ESPERAR UM POUQUINHO.</span><h2>Vamos viver a sua<br>próxima <em>boa história?</em></h2><p>Escolha a companhia. O primeiro passo é falar com a Fran.</p></div><div>${waLink('Bora viajar com a Fran?', 'button button-white')}</div><span class="cta-sun" aria-hidden="true">✳</span></section>
</main>
<footer class="site-footer footer-shell" aria-label="Rodapé da Fran Turismo">
  <div class="container">
    <div class="footer-signoff"><span>DA SERRA AO MAR, COM VOCÊ.</span><span>O Rio é lindo. <em>Vamos descobrir juntos?</em> ${icon('sparkles')}</span></div>
    <div class="footer-grid">
      <div class="footer-brand-column"><a class="brand" href="#inicio" aria-label="Fran Turismo — voltar ao início">${brand}</a><p>Novos caminhos, boas companhias<br>e histórias que ficam com você.</p><span class="footer-location">${icon('map-pin')} Rio de Janeiro · Brasil</span></div>
      <nav class="footer-nav-column" aria-label="Explore a Fran Turismo"><h3>Explore</h3><a href="#destinos">Nossos destinos</a><a href="#agenda">Próximos passeios</a><a href="#sobre">A Fran Turismo</a><a href="#depoimentos">Quem viaja com a gente</a></nav>
      <nav class="footer-nav-column" aria-label="Destinos em destaque"><h3>Inspire-se</h3>${destinations.slice(0, 4).map(d => `<button data-destination="${d.id}">${d.nome} ${icon('arrow-up-right')}</button>`).join('')}</nav>
      <div class="footer-social-column"><h3>A viagem continua por aqui</h3><p>Acompanhe novos destinos, momentos<br>e inspirações para a próxima viagem.</p><div class="footer-socials" id="footer-socials" aria-label="Redes sociais"></div><a class="footer-whatsapp" href="${whatsapp()}" target="_blank" rel="noopener noreferrer">${waIcon}<span>Converse com a Fran<small>Seu próximo passeio começa com um oi.</small></span>${icon('arrow-up-right')}</a></div>
    </div>
    <div class="footer-meta"><span>© ${new Date().getFullYear()} Fran Turismo<span class="footer-meta-dot">·</span>Boas viagens. Boas memórias.</span><button class="text-button" id="credits-button">Créditos das imagens</button><a class="footer-back-top" href="#inicio">De volta ao começo <span>${icon('arrow-up')}</span></a></div>
  </div>
</footer>
<a class="whatsapp-float" href="${whatsapp()}" target="_blank" rel="noopener noreferrer" aria-label="Conversar com a Fran Turismo pelo WhatsApp">${waIcon}<span>Vamos viajar?</span></a>
<dialog id="destination-modal" class="destination-modal" aria-labelledby="modal-title"><button class="modal-close" aria-label="Fechar detalhes">${icon('x')}</button><div id="modal-content"></div></dialog>
<dialog id="credits-modal" class="credits-modal" aria-labelledby="credits-title"><button class="modal-close" aria-label="Fechar créditos">${icon('x')}</button><h2 id="credits-title">Créditos das imagens</h2><p>Fotografias de lugares reais, com seus respectivos autores e licenças. As imagens foram redimensionadas e enquadradas para a página.</p><div id="credits-content"></div></dialog>
`;

// Se o arquivo de conteúdo não puder ser lido, o site continua no ar com um
// aviso claro em vez de deixar a tela em branco ou as listas vazias.
if (!catalogo.ok) {
  document.querySelector('#destination-grid')!.innerHTML = `<div class="empty-destinations"><h3>Estamos preparando os próximos destinos.</h3><p>${catalogo.error ?? ''}</p><a class="button button-navy" href="${whatsapp()}" target="_blank" rel="noopener noreferrer">Falar com a Fran</a></div>`;
}

let activeCategory = 'all';
let expanded = false;
function renderDestinations() {
  if (!destinations.length) return;
  const filtered = destinations.filter(d => activeCategory === 'all' || d.categorias.includes(activeCategory as Category));
  const visible = expanded || activeCategory !== 'all' ? filtered : filtered.slice(0,3);
  document.querySelector('#destination-grid')!.innerHTML = visible.map((d, index) => `<article class="destination-card destination-${d.id}" style="--card-index:${index}"><button class="card-image-button" data-destination="${d.id}" aria-label="Conhecer ${d.nome}"><img src="${destinationImage(d)}" alt="${d.imagemAlt}" loading="lazy" width="960" height="640" /><span class="image-tag">${icon(d.icone)} ${d.selo}</span><span class="image-arrow">${icon('arrow-up-right')}</span></button>${cardActions(d.id)}<div class="card-body"><span class="card-region">${icon('map-pin')} ${d.regiao}</span><h3><button data-destination="${d.id}">${d.nome}</button></h3><p>${d.resumo}</p><div class="card-bottom"><span>Seu próximo destino</span><button class="text-button" data-destination="${d.id}">Quero conhecer ${icon('arrow-up-right')}</button></div></div></article>`).join('') || `<div class="empty-destinations"><h3>Nenhum destino nesta categoria por enquanto.</h3><p>Escolha outra categoria ou fale com a Fran para montar um roteiro do seu jeito.</p><a class="button button-navy" href="${whatsapp()}" target="_blank" rel="noopener noreferrer">Falar com a Fran</a></div>`;
  const allButton = document.querySelector<HTMLButtonElement>('#show-all')!;
  allButton.hidden = activeCategory !== 'all';
  allButton.innerHTML = `${expanded ? 'Mostrar destaques' : 'Conhecer todos os destinos'} ${icon(expanded ? 'arrow-up-right' : 'arrow-right')}`;
  allButton.setAttribute('aria-expanded', String(expanded));
  icons();
}
setupExperience({icons, openDestination, renderDestinations, getCompany: () => document.querySelector<HTMLSelectElement>('#finder-company')!.value});
document.querySelectorAll<HTMLButtonElement>('[data-category]').forEach(button => button.addEventListener('click', () => {
  activeCategory = button.dataset.category!;
  document.querySelectorAll('[data-category]').forEach(b => { b.classList.toggle('active', b === button); b.setAttribute('aria-pressed', String(b === button)); });
  renderDestinations();
}));
document.querySelector('#show-all')!.addEventListener('click', () => { expanded = !expanded; renderDestinations(); });
const destinationModal = document.querySelector<HTMLDialogElement>('#destination-modal')!;
function openDestination(id: string, context = '', tourId?: string) {
  const d = destinations.find(d => d.id === id);
  if (!d) return;
  document.querySelector('#modal-content')!.innerHTML = `<div id="destination-gallery"></div><div class="modal-copy"><span class="eyebrow">${d.selo}</span><h2 id="modal-title">${d.nome}</h2><p>${d.descricao}</p><h3>Inspirações para conhecer</h3><ul>${d.atracoes.map(h => `<li>${icon('check')}${h}</li>`).join('')}</ul><p class="modal-notice">As atrações acima são inspirações do destino. Consulte o roteiro, as datas, os valores e os itens incluídos na saída disponível.</p><div id="travel-details"></div>${consultation(d.id, context)}</div>`;
  mountTravelDetails(d.id, tourId);
  icons(); destinationModal.showModal(); document.body.classList.add('modal-open');
  destinationModal.scrollTop = 0;
  const url = new URL(location.href); url.searchParams.set('destino', id); history.replaceState(null, '', url);
}
document.addEventListener('click', e => {
  const target = (e.target as Element).closest<HTMLElement>('[data-destination]');
  if (target) openDestination(target.dataset.destination!);
});
destinationModal.addEventListener('close', () => {
  const url = new URL(location.href); url.searchParams.delete('destino'); history.replaceState(null, '', url);
});
document.querySelectorAll<HTMLDialogElement>('#destination-modal, #credits-modal').forEach(dialog => {
  dialog.querySelector('.modal-close')!.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close(); } });
  dialog.addEventListener('close', () => document.body.classList.toggle('modal-open', !!document.querySelector('dialog[open]')));
});

const navToggle = document.querySelector<HTMLButtonElement>('.menu-toggle')!;
const setMenu = (open: boolean) => { navToggle.setAttribute('aria-expanded', String(open)); navToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu'); document.querySelector('#main-nav')!.classList.toggle('open', open); navToggle.innerHTML = icon(open ? 'x' : 'menu'); icons(); };
navToggle.addEventListener('click', () => setMenu(navToggle.getAttribute('aria-expanded') !== 'true'));
document.querySelectorAll('#main-nav a').forEach(link => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
document.addEventListener('click', e => { if (!e.composedPath().includes(document.querySelector('.site-header')!) && navToggle.getAttribute('aria-expanded') === 'true') setMenu(false); });

let tours: Tour[] = [];
let agendaLoaded = false;
let company = 'Ainda estou decidindo';
const agendaDestination = document.querySelector<HTMLSelectElement>('#agenda-destination')!;
const agendaMonth = document.querySelector<HTMLSelectElement>('#agenda-month')!;
const formatDate = (value: string, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('pt-BR', options).format(new Date(`${value}T12:00:00`));
const validDate = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T12:00:00`).getTime()) && new Date(`${value}T12:00:00`).toLocaleDateString('en-CA') === value;
function renderAgenda() {
  if (!agendaLoaded) return;
  const filtered = tours.filter(t => (agendaDestination.value === 'all' || t.destinationId === agendaDestination.value) && (agendaMonth.value === 'all' || (agendaMonth.value === 'pending' ? !t.date : t.date?.startsWith(agendaMonth.value))));
  const hasDates = tours.some(t => t.date);
  document.querySelector('#agenda-status')!.textContent = hasDates ? `${filtered.length} passeio${filtered.length === 1 ? '' : 's'} encontrado${filtered.length === 1 ? '' : 's'}. Consulte disponibilidade com a Fran.` : 'Novas saídas em preparação. Consulte a Fran para confirmar as próximas datas.';
  document.querySelector<HTMLButtonElement>('#clear-agenda')!.hidden = agendaDestination.value === 'all' && agendaMonth.value === 'all';
  document.querySelector('#tour-list')!.innerHTML = filtered.length ? filtered.map(t => {
    const d = destinations.find(d => d.id === t.destinationId)!;
    const date = t.date ? `<strong>${formatDate(t.date, { day: '2-digit' })}</strong><span>${formatDate(t.date, { month: 'short' }).replace('.','').toUpperCase()}</span><small>${formatDate(t.date, { year: 'numeric' })}</small>` : `${icon('calendar-days')}<span>EM BREVE</span>`;
    const message = `Olá, Fran Turismo! ${t.date ? 'Tenho interesse' : 'Quero saber da próxima saída e combinar com a equipe como receber novidades'} no passeio “${t.title}”, para ${d.nome}${t.date ? ` em ${formatDate(t.date, {dateStyle:'long'})}` : ''}. ${company !== 'Ainda estou decidindo' ? company + '. ' : ''}Pode me informar ${t.date ? 'a disponibilidade' : 'a próxima data'}, os valores e o local de embarque?`;
    return `<article class="tour-row travel-ticket"><div class="ticket-stub"><span class="ticket-brand" aria-hidden="true">FRAN<br>TURISMO</span><div class="tour-date ${t.date ? 'confirmed' : ''}">${date}</div><span class="ticket-stub-note" aria-hidden="true">${icon('bus')} VAMOS JUNTOS</span></div><img src="${destinationImage(d)}" alt="${d.imagemAlt}" loading="lazy" width="90" height="90" /><div class="tour-info"><span class="tour-status ${t.date ? 'status-confirmed' : 'status-pending'}">${t.date ? 'DATA PROGRAMADA' : 'DATA A CONFIRMAR'}</span><h3>${esc(t.title)}</h3><span>${icon('map-pin')}${d.nome}</span><p class="ticket-boarding"><span>EMBARQUE</span>${t.departure ? esc(t.departure) : 'A combinar com a Fran'}</p>${t.price !== null ? `<strong class="tour-price">${new Intl.NumberFormat('pt-BR', {style:'currency',currency:'BRL'}).format(t.price)}</strong>` : ''}</div><a class="tour-link" href="${whatsapp(message)}" target="_blank" rel="noopener noreferrer" aria-label="Consultar passeio para ${d.nome}">${icon('arrow-up-right')}</a><div class="tour-actions"><a href="${whatsapp(message)}" target="_blank" rel="noopener noreferrer">${icon(t.date ? 'message-circle' : 'calendar-days')}${t.date ? 'Consultar disponibilidade' : 'Quero saber da próxima saída'}</a><button data-consult="${d.id}" data-tour-id="${esc(t.id)}" data-consult-context="${esc(`o passeio ${t.title}, para ${d.nome}${t.date ? ` em ${formatDate(t.date, {dateStyle: 'long'})}` : ''}`)}">Personalizar consulta ${icon('arrow-up-right')}</button>${t.date ? `<button data-calendar="${esc(t.id)}">${icon('calendar-days')} Salvar no calendário</button>` : ''}</div></article>`;
  }).join('') : `<div class="empty-agenda">${icon('compass')}<h3>Seu próximo passeio pode começar aqui.</h3><p>Ainda não há saídas publicadas para essa seleção. Fale com a Fran para consultar ${agendaDestination.value === 'all' ? 'as próximas oportunidades' : 'passeios para ' + destinations.find(d=>d.id===agendaDestination.value)!.nome}.</p>${waLink('Consultar novas saídas', 'button button-navy', `Olá, Fran Turismo! Gostaria de consultar novas saídas${agendaDestination.value === 'all' ? '' : ' para ' + destinations.find(d=>d.id===agendaDestination.value)!.nome}. Pode me ajudar?`)}</div>`;
  icons();
}
async function loadAgenda() {
  try {
    const response = await fetch('/passeios.json');
    if (!response.ok) throw new Error('Agenda indisponível');
    const data: unknown = await response.json();
    if (!Array.isArray(data)) throw new Error('Agenda inválida');
    const today = new Date(); today.setHours(0,0,0,0);
    tours = data.filter((t): t is Tour => !!t && typeof t.id === 'string' && typeof t.title === 'string' && destinations.some(d => d.id === t.destinationId) && (t.date === null || validDate(t.date)) && (t.departure === null || typeof t.departure === 'string') && (t.price === null || typeof t.price === 'number' && Number.isFinite(t.price) && t.price >= 0)).filter(t => !t.date || new Date(`${t.date}T12:00:00`) >= today).sort((a,b) => (a.date ?? '9999').localeCompare(b.date ?? '9999'));
    [...new Set(tours.filter(t => t.date).map(t => t.date!.slice(0,7)))].sort().forEach(month => { agendaMonth.add(new Option(formatDate(month + '-01', {month:'long',year:'numeric'}), month)); });
    agendaLoaded = true; renderAgenda(); refreshTravelDetails();
  } catch {
    document.querySelector('#agenda-status')!.textContent = 'Não foi possível carregar a agenda agora.';
    document.querySelector('#tour-list')!.innerHTML = `<div class="empty-agenda"><p>Você pode consultar as próximas saídas diretamente com a Fran.</p>${waLink('Consultar pelo WhatsApp', 'button button-navy')}</div>`;
  }
}
agendaDestination.addEventListener('change', renderAgenda);
agendaMonth.addEventListener('change', renderAgenda);
document.querySelector('#clear-agenda')!.addEventListener('click', () => { agendaDestination.value = 'all'; agendaMonth.value = 'all'; renderAgenda(); });
document.querySelector('#trip-finder')!.addEventListener('submit', e => { e.preventDefault(); agendaDestination.value = document.querySelector<HTMLSelectElement>('#finder-destination')!.value; company = document.querySelector<HTMLSelectElement>('#finder-company')!.value; agendaMonth.value = 'all'; renderAgenda(); document.querySelector('#agenda')!.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'}); agendaDestination.focus({preventScroll:true}); });

function postcardPhoto(label: string) {
  const destination = destinations.find(d => label.toLocaleLowerCase('pt-BR').includes(d.nome.toLocaleLowerCase('pt-BR')));
  return destination ? `<figure class="postcard-scene"><img src="${destinationImage(destination)}" alt="Paisagem de ${destination.nome}, ilustrando o destino do relato" loading="lazy" width="400" height="200"/><figcaption>${icon('map-pin')}${destination.nome}<span>PAISAGEM DO DESTINO</span></figcaption></figure>` : '';
}
function testimonialAvatar(entry: Testimonial) {
  if (typeof entry.portrait === 'string' && /^\/images\/people\/[a-z0-9-]+\.(?:png|jpe?g|webp)$/.test(entry.portrait)) {
    const alt = entry.portraitGenerated ? `Retrato gerado por IA para ${entry.name}, personagem fictício` : `Foto de ${entry.name}`;
    return `<img class="review-portrait" src="${esc(entry.portrait)}" alt="${esc(alt)}" width="72" height="72" loading="lazy" decoding="async" />`;
  }
  return `<span class="avatar">${esc(entry.name.trim().split(/\s+/).filter(n=>n.length>1).map(n=>n[0]).slice(0,2).join('').toUpperCase())}</span>`;
}
async function loadTestimonials() {
  let entries: Testimonial[] = [];
  try {
    const response = await fetch('/depoimentos.json');
    if (!response.ok) throw new Error('Depoimentos indisponíveis');
    const data: unknown = await response.json();
    if (Array.isArray(data)) entries = data.filter((t): t is Testimonial => !!t && typeof t.name === 'string' && typeof t.destination === 'string' && typeof t.text === 'string' && !!t.text.trim());
  } catch { /* Keep the invitation visible if reviews are unavailable. */ }
  const container = document.querySelector('#testimonials-content')!;
  if (entries.length) {
    const cards = entries.map(t => `<article class="review-card memory-postcard">${postcardPhoto(t.destination)}<div class="postcard-quote-heading">${icon('quote', 'quote-icon')}<span>Do nosso álbum de histórias</span></div>${t.illustrative ? '<span class="illustrative-label">Relato ilustrativo</span>' : ''}<blockquote>${esc(t.text)}</blockquote><div class="review-author">${testimonialAvatar(t)}<span class="review-author-info"><strong>${esc(t.name)}</strong><small>${esc(t.destination)}</small>${t.portraitGenerated ? '<span class="portrait-disclosure">Retrato ilustrativo · IA</span>' : ''}</span>${icon('heart')}</div></article>`).join('');
    container.innerHTML = `${entries.some(t => t.illustrative) ? '<p class="testimonials-disclaimer">Uma prévia das boas memórias: relatos fictícios e ilustrativos, com retratos gerados por IA.</p>' : ''}<div class="review-carousel" role="region" aria-label="Depoimentos — deslize para explorar" tabindex="0"><div class="review-track"><div class="review-set">${cards}</div><div class="review-set review-copy" aria-hidden="true" inert>${cards}</div></div></div><div class="review-motion-controls"><span>Histórias que inspiram a próxima viagem</span><button type="button" id="reviews-motion" aria-pressed="false">Pausar movimento</button></div>`;
    icons();
    const viewport = container.querySelector<HTMLElement>('.review-carousel')!;
    const set = container.querySelector<HTMLElement>('.review-set')!;
    const button = container.querySelector<HTMLButtonElement>('#reviews-motion')!;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let paused = reducedMotion.matches;
    let hovered = false;
    let focused = false;
    let visible = false;
    let last = 0;
    let position = 0;
    const update = () => {
      button.textContent = paused ? 'Retomar movimento' : 'Pausar movimento';
      button.setAttribute('aria-pressed', String(paused));
    };
    update();
    button.addEventListener('click', () => { paused = !paused; update(); });
    viewport.addEventListener('mouseenter', () => { hovered = true; });
    viewport.addEventListener('mouseleave', () => { hovered = false; });
    viewport.addEventListener('focusin', () => { focused = true; });
    viewport.addEventListener('focusout', () => { focused = false; });
    const pause = () => { paused = true; update(); };
    viewport.addEventListener('pointerdown', pause, { passive: true });
    viewport.addEventListener('wheel', pause, { passive: true });
    viewport.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault(); pause();
        viewport.scrollLeft += (event.key === 'ArrowRight' ? 1 : -1) * viewport.clientWidth / 2;
      }
    });
    reducedMotion.addEventListener('change', () => { paused = reducedMotion.matches; update(); });
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(viewport);
    // Two identical sets make the wrap visually seamless; only the original is exposed to assistive technology.
    const tick = (now: number) => {
      const elapsed = Math.min(now - (last || now), 50);
      last = now;
      if (visible && !document.hidden && !paused && !hovered && !focused && set.offsetWidth) {
        position = (position + elapsed * 0.032) % set.offsetWidth;
        viewport.scrollLeft = position;
      } else { position = viewport.scrollLeft; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  } else {
    container.innerHTML = `<div class="review-invitation"><div class="memory-photo memory-photo-one"><img src="/images/teresopolis.jpg" alt="Montanhas para guardar na memória" loading="lazy" width="280" height="220" /><span>um novo horizonte ♡</span></div><div class="invitation-copy">${icon('quote', 'quote-icon')}<h3>Tem uma história sua<br>esperando por aqui.</h3><p>Já passeou com a Fran? Conte o que fez sua viagem especial. Este espaço é para as memórias de quem viveu a experiência.</p><span class="review-empty-label">Em breve, relatos dos nossos viajantes.</span></div><div class="memory-photo memory-photo-two"><img src="/images/penedo.jpg" alt="Um passeio pelas casas coloridas de Penedo" loading="lazy" width="280" height="220" /><span>um dia para lembrar ♡</span></div></div>`;
    icons();
  }
}
document.querySelector('#credits-button')!.addEventListener('click', async () => {
  const modal = document.querySelector<HTMLDialogElement>('#credits-modal')!;
  const container = document.querySelector('#credits-content')!;
  container.textContent = 'Carregando créditos…'; modal.showModal(); document.body.classList.add('modal-open');
  try {
    const response = await fetch('/image-credits.json'); if (!response.ok) throw new Error();
    const credits: {title:string;author:string;source:string;license:string;licenseUrl:string}[] = await response.json();
    container.innerHTML = credits.map(c => `<article><a href="${esc(c.source)}" target="_blank" rel="noopener noreferrer">${esc(c.title)}</a><p>${esc(c.author)} · <a href="${esc(c.licenseUrl)}" target="_blank" rel="noopener noreferrer">${esc(c.license)}</a></p></article>`).join('');
  } catch { container.innerHTML = '<p>Os créditos também estão disponíveis no <a href="/image-credits.json">arquivo de créditos das imagens</a>.</p>'; }
});
// Replace the demonstration links with Fran Turismo's official profiles when available.
const socialProfiles = [
  { name: 'Instagram', icon: 'instagram', url: 'https://www.instagram.com/' },
  { name: 'Facebook', icon: 'facebook', url: 'https://www.facebook.com/' },
];
document.querySelector('#footer-socials')!.innerHTML = socialProfiles.map(social =>
  `<a class="footer-social-link" href="${esc(social.url)}" target="_blank" rel="noopener noreferrer" aria-label="${social.name} — link demonstrativo" title="Link demonstrativo: substituir pelo perfil oficial da Fran Turismo">${icon(social.icon)}<span>${social.name}<small>Link demonstrativo</small></span>${icon('arrow-up-right')}</a>`
).join('');
setupTravelDetails({getTours: () => tours, icons, onSelect: (id, tour) => {
  const context = tour ? `o passeio ${tour.title}, para ${destinations.find(d=>d.id===id)!.nome}${tour.date ? ` em ${formatDate(tour.date, {dateStyle:'long'})}` : ''}` : '';
  openDestination(id, context, tour?.id ?? '');
}});
renderDestinations();
void loadAgenda();
void loadTestimonials();
icons();

const sharedDestination = new URL(location.href).searchParams.get('destino');
if (sharedDestination) openDestination(sharedDestination);
