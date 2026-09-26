import { destinations, escapeHtml as esc, whatsapp } from './data';
import { destinationImage, categoryOptions, categoryLabel } from './catalog';
import './experience.css';
const comparison = new Set<string>();
const i = (name:string) => `<i data-lucide="${name}" aria-hidden="true"></i>`;
let quizContext = '';
let toastTimer: ReturnType<typeof setTimeout>;
/** Estilo curto do destino, usado no comparador e no resultado do quiz. */
const estiloDe = (id:string) => destinations.find(d => d.id === id)?.estilo ?? '';
export function cardActions(id:string) {
 const name = destinations.find(d=>d.id===id)!.nome;
 return `<div class="card-actions"><button class="compare-choice" data-compare="${id}" aria-pressed="${comparison.has(id)}">${i('columns-2')} ${comparison.has(id)?'Selecionado':'Comparar'}</button><button class="share-choice" data-share="${id}" aria-label="Compartilhar ${name}">${i('share-2')} Vamos juntos?</button></div>`;
}
export function consultation(id:string, tourContext = '') {
 const d = destinations.find(d=>d.id===id)!;
 return `<details class="consultation" data-tour-context="${esc(tourContext)}"><summary>Deixe a consulta do seu jeito <span>Opcional ${i('chevron-down')}</span></summary><div class="consult-fields"><label>Quantas pessoas?<input id="consult-people" type="number" min="1" max="99" step="1" inputmode="numeric" placeholder="Ex.: 2" /></label><label>Preferência de embarque<input id="consult-departure" type="text" maxlength="100" placeholder="Seu bairro ou cidade" autocomplete="off" /></label></div><p>O ponto de embarque será combinado com a Fran. Você pode continuar sem preencher.</p><span id="consult-error" role="status"></span></details><a id="consult-link" class="button button-orange" href="${whatsapp(`Olá, Fran Destinos! Quero consultar ${tourContext || `um passeio para ${d.nome}`}. ${quizContext}Quais são as datas, os valores, o roteiro e os pontos de embarque?`)}" target="_blank" rel="noopener noreferrer">${i('message-circle')} Consultar passeio para ${d.nome}</a><button class="modal-share text-button" data-share="${id}">${i('share-2')} Vamos juntos? Compartilhar destino</button>`;
}
export function setupExperience(options:{icons:()=>void;openDestination:(id:string, context?:string, tourId?:string)=>void;renderDestinations:()=>void;getCompany:()=>string}) {
 const {icons,openDestination,getCompany}=options;
 const notify=(message:string)=>{
  const toast=document.querySelector<HTMLElement>('#experience-toast')!;
  toast.textContent=message;toast.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{toast.hidden=true},4500);
 };
 document.body.insertAdjacentHTML('beforeend',`<div id="experience-toast" role="status" hidden></div><aside class="compare-tray" aria-label="Destinos para comparar" hidden><span id="compare-summary" aria-live="polite"></span><button id="open-comparison" class="button button-navy" disabled>Comparar destinos</button><button id="clear-comparison" class="text-button">Limpar</button></aside><dialog id="compare-modal" class="experience-dialog" aria-labelledby="compare-title"><button class="modal-close" aria-label="Fechar comparação">${i('x')}</button><span class="eyebrow">QUAL COMBINA COM VOCÊ?</span><h2 id="compare-title">Dois destinos.<br>Novas <em>possibilidades.</em></h2><div id="compare-content"></div></dialog><dialog id="share-modal" class="experience-dialog share-dialog" aria-labelledby="share-title"><button class="modal-close" aria-label="Fechar compartilhamento">${i('x')}</button><h2 id="share-title">Vamos juntos?</h2><p>Copie este link e envie para sua companhia de viagem.</p><label>Link do destino<input id="share-url" readonly /></label><button id="copy-share-url" class="button button-navy">Copiar link</button><p id="share-feedback" role="status"></p></dialog>`);
 const comparisonModal=document.querySelector<HTMLDialogElement>('#compare-modal')!;
 const shareModal=document.querySelector<HTMLDialogElement>('#share-modal')!;
 [comparisonModal,shareModal].forEach(dialog=>{
  dialog.querySelector('.modal-close')!.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  dialog.addEventListener('close',()=>document.body.classList.toggle('modal-open',!!document.querySelector('dialog[open]')));
 });
 const updateComparison=()=>{
  const tray=document.querySelector<HTMLElement>('.compare-tray')!;
  tray.hidden=comparison.size===0;
  document.body.classList.toggle('has-comparison',comparison.size>0);
  document.querySelector('#compare-summary')!.textContent=[...comparison].map(id=>destinations.find(d=>d.id===id)!.nome).join(' + ') + (comparison.size===1?' · Escolha mais um destino':'');
  document.querySelector<HTMLButtonElement>('#open-comparison')!.disabled=comparison.size!==2;
  document.querySelectorAll<HTMLButtonElement>('[data-compare]').forEach(button=>{const selected=comparison.has(button.dataset.compare!);button.setAttribute('aria-pressed',String(selected));button.innerHTML=`${i('columns-2')} ${selected?'Selecionado':'Comparar'}`;});
  icons();
 };
 document.querySelector('.destinations-toolbar')!.insertAdjacentHTML('afterend',`<div class="discovery-tools"><p>${i('columns-2')} Escolha dois destinos e veja as diferenças lado a lado.</p></div>`);
 document.querySelector('.destinations-toolbar')!.insertAdjacentHTML('beforebegin',`<section class="trip-quiz" aria-labelledby="quiz-title"><div class="quiz-intro"><span class="eyebrow">UMA AJUDINHA PARA ESCOLHER</span><h3 id="quiz-title">Que tal um passeio com a sua cara?</h3><p>Três escolhas para encontrar sua próxima inspiração.</p></div><form id="quiz-form"><label>Qual cenário?<select name="scenery"><option value="all">Quero me surpreender</option>${categoryOptions().map(c => `<option value="${esc(c.value)}">${esc(c.label)}</option>`).join('')}</select></label><label>Qual é o seu ritmo?<select name="pace"><option value="relax">Descansar e aproveitar</option><option value="explore">Explorar e descobrir</option></select></label><label>Com quem você vai?<select name="party"><option>Vou por conta própria</option><option>Vou em casal</option><option>Vou com a família</option><option>Vou com amigos</option></select></label><button class="button button-navy" type="submit">Encontrar meu passeio ${i('sparkles')}</button></form><div id="quiz-results" tabindex="-1" hidden></div></section>`);
 document.querySelector('#quiz-form')!.addEventListener('submit',e=>{
  e.preventDefault();const form=new FormData(e.target as HTMLFormElement);const scenery=String(form.get('scenery')),pace=String(form.get('pace')),party=String(form.get('party'));
  const relaxed=['penedo','arraial','petropolis'];
  const ranked=destinations.filter(d=>scenery==='all'||d.categorias.includes(scenery as 'serra')).map(d=>({d,score:(relaxed.includes(d.id)===(pace==='relax')?2:0)})).sort((a,b)=>b.score-a.score).slice(0,2);
  quizContext=`${party}. Prefiro ${pace==='relax'?'descansar e aproveitar':'explorar e descobrir'}${scenery==='all'?'':scenery==='serra'?' na serra':scenery==='litoral'?' no litoral':` em ${categoryLabel(scenery)}`}. `;
  const companySelect=document.querySelector<HTMLSelectElement>('#finder-company');if(companySelect)companySelect.value=party;
  const results=document.querySelector<HTMLElement>('#quiz-results')!;
  results.hidden=false;results.innerHTML=`<div class="quiz-results-heading"><strong>Suas próximas boas histórias</strong><span>Inspirações pelo cenário e ritmo que você escolheu. A Fran ajuda a combinar os detalhes.</span></div><div class="quiz-matches">${ranked.map(({d})=>`<button data-destination="${d.id}"><img src="${destinationImage(d)}" alt="${d.imagemAlt}" width="80" height="70" /><span><strong>${d.nome}</strong><small>${estiloDe(d.id)}</small></span>${i('arrow-up-right')}</button>`).join('')}</div>`;
  icons();results.focus({preventScroll:true});results.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'nearest'});
 });
 document.querySelector('#clear-comparison')!.addEventListener('click',()=>{comparison.clear();updateComparison();document.querySelector<HTMLElement>('.discovery-tools button')?.focus({preventScroll:true});});
 document.querySelector('#open-comparison')!.addEventListener('click',()=>{
  const selected=[...comparison].map(id=>destinations.find(d=>d.id===id)!);
  document.querySelector('#compare-content')!.innerHTML=`<div class="comparison-scroll"><table class="comparison-table"><caption class="sr-only">Comparação de região, estilo e atrações dos destinos</caption><thead><tr><th scope="col">Seu passeio</th>${selected.map(d=>`<th scope="col"><img src="${destinationImage(d)}" alt="${d.imagemAlt}" /><strong>${d.nome}</strong></th>`).join('')}</tr></thead><tbody><tr><th scope="row">Região</th>${selected.map(d=>`<td>${d.regiao}</td>`).join('')}</tr><tr><th scope="row">Estilo</th>${selected.map(d=>`<td>${estiloDe(d.id)}</td>`).join('')}</tr><tr><th scope="row">Para descobrir</th>${selected.map(d=>`<td><ul>${d.atracoes.map(h=>`<li>${h}</li>`).join('')}</ul></td>`).join('')}</tr><tr><th scope="row">Saiba mais</th>${selected.map(d=>`<td><button class="text-button" data-compare-open="${d.id}">Conhecer ${d.nome} ${i('arrow-up-right')}</button></td>`).join('')}</tr></tbody></table></div><p class="comparison-note">Atrações são inspirações do destino. Datas, roteiro, acessibilidade e valores devem ser confirmados com a Fran.</p>`;
  icons();comparisonModal.showModal();document.body.classList.add('modal-open');
 });
 async function copyLink(url:string) {
  try {await navigator.clipboard.writeText(url);return true;} catch {return false;}
 }
 async function shareDestination(id:string) {
  const d=destinations.find(d=>d.id===id)!;const url=new URL(location.href);url.search='';url.hash='';url.searchParams.set('destino',id);
  if(navigator.share){try{await navigator.share({title:`${d.nome} com a Fran Destinos`,text:`Vamos juntos conhecer ${d.nome}?`,url:url.href});return;}catch(error){if(error instanceof Error&&error.name==='AbortError')return;}}
  if(await copyLink(url.href)){notify('Link copiado! Envie para sua companhia de viagem.');return;}
  const input=document.querySelector<HTMLInputElement>('#share-url')!;input.value=url.href;document.querySelector('#share-feedback')!.textContent='';shareModal.showModal();document.body.classList.add('modal-open');input.focus();input.select();
 }
 document.querySelector('#copy-share-url')!.addEventListener('click',async()=>{const input=document.querySelector<HTMLInputElement>('#share-url')!;const copied=await copyLink(input.value);document.querySelector('#share-feedback')!.textContent=copied?'Link copiado!':'Selecione o link e use a opção Copiar do seu dispositivo.';if(!copied){input.focus();input.select();}});
 document.addEventListener('click',e=>{
  const target=(e.target as Element).closest<HTMLElement>('[data-compare],[data-share],[data-compare-open],[data-consult]');if(!target)return;
  if(target.dataset.compare){const id=target.dataset.compare;if(comparison.has(id))comparison.delete(id);else if(comparison.size<2)comparison.add(id);else{notify('Compare até dois destinos. Desmarque um antes de escolher outro.');return;}updateComparison();}
  if(target.dataset.share)void shareDestination(target.dataset.share);
  if(target.dataset.compareOpen){comparisonModal.close();openDestination(target.dataset.compareOpen);}
  if(target.dataset.consult)openDestination(target.dataset.consult, target.dataset.consultContext, target.dataset.tourId);
 });
 const updateConsultation=()=>{
  const link=document.querySelector<HTMLAnchorElement>('#consult-link');if(!link)return;
  const id=document.querySelector<HTMLElement>('#modal-content [data-share]')?.dataset.share;const d=destinations.find(d=>d.id===id);if(!d)return;
  const people=document.querySelector<HTMLInputElement>('#consult-people')!;const departure=document.querySelector<HTMLInputElement>('#consult-departure')!;
  const tourContext=document.querySelector<HTMLElement>('.consultation')?.dataset.tourContext;
  const context=quizContext || (getCompany()==='Ainda estou decidindo'?'':getCompany()+'. ');
  link.href=whatsapp(`Olá, Fran Destinos! Quero consultar ${tourContext || `um passeio para ${d.nome}`}. ${context}${people.value&&people.validity.valid?`Vamos em ${people.value} pessoa(s). `:''}${departure.value.trim()?`Preferência de embarque: ${departure.value.trim()}. `:''}Quais são as próximas datas, valores, roteiro e pontos de embarque?`);
  document.querySelector('#consult-error')!.textContent=people.validity.valid?'':'Informe de 1 a 99 pessoas, ou deixe o campo em branco.';
 };
 document.querySelector('#modal-content')!.addEventListener('input',updateConsultation);
 document.querySelector('#modal-content')!.addEventListener('click',e=>{if((e.target as Element).closest('#consult-link')){updateConsultation();const people=document.querySelector<HTMLInputElement>('#consult-people');if(people&&!people.validity.valid){e.preventDefault();people.closest('details')!.open=true;people.reportValidity();}}});
 document.querySelector('#finder-company')!.addEventListener('change',()=>{quizContext='';});
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 if(!reduced.matches&&'IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('revealed');observer.unobserve(entry.target);}}),{threshold:.08});document.querySelectorAll('.section-heading,.about-visual,.steps article,.final-cta').forEach(el=>{el.classList.add('reveal');observer.observe(el);});}
 const footerObserver=new IntersectionObserver(entries=>{document.body.classList.toggle('footer-visible',entries[0].isIntersecting);},{threshold:0});footerObserver.observe(document.querySelector('footer')!);
 icons();
}
