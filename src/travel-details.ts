import { destinations, escapeHtml as esc, type Tour } from './data';
import { travelProfile, type Photo, type TripFacts, type TripStep, type TripQuestion } from './travel-data';
import { calendarEvent, createCalendarFile, googleCalendarUrl, isCalendarDate } from './calendar';
import './travel-details.css';
const icon=(name:string)=>`<i data-lucide="${name}" aria-hidden="true"></i>`;
let getTours:()=>Tour[]=()=>[];
let refreshIcons:()=>void=()=>{};
let selectTour:(destinationId:string,tour:Tour|null)=>void=()=>{};
let currentId='';
let currentTourId: string|undefined;
let photos:Photo[]=[];
let activePhoto=0;
let openPhotoButton: HTMLElement|null=null;
const strings=(value:unknown):string[]=>Array.isArray(value)?value.filter((s):s is string=>typeof s==='string'&&!!s.trim()):[];
function factsFor(tour?:Tour):TripFacts {
 const raw=tour?.details;if(!raw||typeof raw!=='object')return {};
 const itinerary=Array.isArray(raw.itinerary)?raw.itinerary.filter((step):step is TripStep=>!!step&&typeof step.title==='string'&&typeof step.description==='string'&&(step.time===null||typeof step.time==='string')):[];
 const faq=Array.isArray(raw.faq)?raw.faq.filter((q):q is TripQuestion=>!!q&&typeof q.question==='string'&&typeof q.answer==='string'):[];
 return {itinerary,faq,included:strings(raw.included),extras:strings(raw.extras),bring:strings(raw.bring),walking:typeof raw.walking==='string'?raw.walking:undefined,accessibility:typeof raw.accessibility==='string'?raw.accessibility:undefined};
}
const dateLabel=(date:string)=>new Intl.DateTimeFormat('pt-BR',{dateStyle:'long'}).format(new Date(date+'T12:00:00'));
const list=(items:string[]|undefined, fallback:string)=>items?.length?`<ul>${items.map(item=>`<li>${esc(item)}</li>`).join('')}</ul>`:`<p class="fact-pending">${esc(fallback)}</p>`;
export function mountTravelDetails(id:string,tourId?:string) {
 currentId=id;currentTourId=tourId;
 const profile=travelProfile(id);
 photos=profile.gallery;
 const gallery=document.querySelector('#destination-gallery');
 if(!gallery)return;
 gallery.innerHTML=`<button class="gallery-hero" data-photo="0" aria-label="Ampliar foto de ${destinations.find(d=>d.id===id)!.nome}"><img class="modal-photo" src="${photos[0].src}" alt="${esc(photos[0].alt)}" /><span>${icon('camera')} Ver ${photos.length} fotos ${icon('expand')}</span></button><div class="gallery-thumbnails" aria-label="Fotos do destino">${photos.map((p,index)=>`<button data-photo="${index}" aria-label="Ampliar foto ${index+1}: ${esc(p.caption)}"><img src="${p.src}" alt="${esc(p.alt)}" width="140" height="85" loading="lazy" /></button>`).join('')}<p>Paisagens para inspirar sua viagem.<br>As visitas dependem do roteiro escolhido.</p></div>`;
 refreshTravelDetails();
}
export function refreshTravelDetails() {
 const container=document.querySelector('#travel-details');
 if(!container||!currentId)return;
 const profile=travelProfile(currentId);
 const departures=getTours().filter(t=>t.destinationId===currentId);
 const selected=currentTourId!==undefined?departures.find(t=>t.id===currentTourId):departures.length===1?departures[0]:undefined;
 const facts=factsFor(selected);
 const calendario=destinations.find(d=>d.id===currentId)?.calendario;
 // O roteiro vem preenchido em public/destinos.json e pode ser editado sem código.
 // A saída escolhida na agenda, quando tem roteiro próprio, tem prioridade.
 const steps:TripStep[]=facts.itinerary?.length?facts.itinerary:profile.itinerary;
 const confirmed=steps.some(step=>!!step.time);
 const faq=facts.faq?.length?facts.faq:profile.faq;
 const bring=facts.bring?.length?facts.bring:profile.bring;
 container.innerHTML=`${departures.length?`<div class="departure-selector"><label for="detail-tour-select">Informações por saída</label><select id="detail-tour-select"><option value="">Visão geral do destino</option>${departures.map(t=>`<option value="${esc(t.id)}" ${selected?.id===t.id?'selected':''}>${esc(t.title)} · ${t.date?dateLabel(t.date):'Data a confirmar'}</option>`).join('')}</select></div>`:''}
 <nav class="detail-shortcuts" aria-label="Nesta apresentação"><button data-detail-section="trip-itinerary">${icon('route')} Roteiro</button><button data-detail-section="trip-practical">${icon('info')} Informações</button><button data-detail-section="trip-faq">${icon('message-circle')} Dúvidas</button></nav>
 <section id="trip-itinerary" class="detail-section"><div class="detail-section-heading"><span class="eyebrow">DO EMBARQUE ÀS BOAS MEMÓRIAS</span><h3>${confirmed?'Roteiro desta saída':'Como o dia pode acontecer'}</h3></div><p class="detail-note">${confirmed?'Horários previstos; confirme a programação final com a Fran.':'Sequência ilustrativa para ajudar a planejar. Paradas e horários ainda precisam ser confirmados pela Fran.'}</p><ol class="trip-timeline">${steps.map((step,index)=>`<li><span class="timeline-number">${String(index+1).padStart(2,'0')}</span><div><span class="timeline-time">${esc(step.time||'Horário a confirmar')}</span><h4>${esc(step.title)}</h4><p>${esc(step.description)}</p></div></li>`).join('')}</ol></section>
 <section id="trip-practical" class="detail-section"><div class="detail-section-heading"><span class="eyebrow">PARA VIAJAR COM MAIS TRANQUILIDADE</span><h3>Antes de arrumar a mala</h3></div><div class="practical-grid"><article>${icon('check')}<h4>O que está incluído</h4>${list(facts.included,'Itens incluídos a confirmar. Pergunte sobre transporte, acompanhamento, refeições e ingressos.')}</article><article>${icon('wallet')}<h4>Possíveis gastos extras</h4>${list(facts.extras,'Valores a confirmar. Verifique refeições, ingressos e atividades opcionais. Reserve também para compras pessoais.')}</article><article>${icon('footprints')}<h4>Caminhadas e ritmo</h4><p>${esc(facts.walking||'Intensidade ainda não informada. Consulte distâncias, duração, escadas e pausas antes de reservar.')}</p></article><article>${icon('accessibility')}<h4>Acessibilidade</h4><p>${esc(facts.accessibility||'Condições ainda não confirmadas. Informe suas necessidades para verificar acessos, veículo e estrutura das paradas.')}</p></article></div><div class="packing-list"><h4>${icon('backpack')} ${facts.bring?.length?'O que levar nesta saída':'Sugestões do que levar'}</h4><ul>${bring.map(item=>`<li>${icon('check')}${esc(item)}</li>`).join('')}</ul><p>Ajuste os itens ao roteiro e à previsão do tempo antes de sair.</p></div></section>
 <section id="trip-faq" class="detail-section"><div class="detail-section-heading"><span class="eyebrow">OS DETALHES FAZEM DIFERENÇA</span><h3>Dúvidas sobre ${destinations.find(d=>d.id===currentId)!.nome}</h3></div><div class="destination-faq">${faq.map(q=>`<details><summary>${esc(q.question)}${icon('plus')}</summary><p>${esc(q.answer)}</p></details>`).join('')}</div></section>
 <section class="detail-calendar"><div>${icon('calendar-days')}<span><h3>${esc(calendario?.titulo || 'Guarde a data')}</h3><p>${esc(selected?.date?(calendario?.confirmado || 'Leve este passeio para a agenda do seu celular.'):(calendario?.pendente || 'Assim que a data for publicada, você poderá salvar o passeio no calendário.'))}</p></span></div>${selected?.date?`<button class="button button-navy" data-calendar="${esc(selected.id)}">Adicionar ao calendário ${icon('plus')}</button>`:'<span class="calendar-pending">Aguardando data confirmada</span>'}</section>`;
 const consult=document.querySelector<HTMLElement>('.consultation');
 if(consult){
  consult.dataset.tourContext=selected?`o passeio ${selected.title}, para ${destinations.find(d=>d.id===currentId)!.nome}${selected.date?` em ${dateLabel(selected.date)}`:''}`:'';
  consult.dispatchEvent(new Event('input',{bubbles:true}));
 }
 container.querySelector<HTMLSelectElement>('#detail-tour-select')?.addEventListener('change',e=>{
  const id=(e.target as HTMLSelectElement).value;selectTour(currentId,departures.find(t=>t.id===id)??null);
 });
 refreshIcons();
}
export function setupTravelDetails(options:{getTours:()=>Tour[];icons:()=>void;onSelect:(id:string,tour:Tour|null)=>void}) {
 getTours=options.getTours;refreshIcons=options.icons;selectTour=options.onSelect;
 document.body.insertAdjacentHTML('beforeend',`<dialog id="photo-lightbox" aria-labelledby="photo-caption"><button class="modal-close" aria-label="Fechar galeria">${icon('x')}</button><div class="lightbox-stage"><div id="lightbox-photo"></div><button class="gallery-arrow gallery-prev" aria-label="Foto anterior">${icon('chevron-left')}</button><button class="gallery-arrow gallery-next" aria-label="Próxima foto">${icon('chevron-right')}</button></div><div class="lightbox-caption"><p id="photo-caption"></p><span id="photo-counter" role="status"></span></div><p class="gallery-hint">Deslize para navegar ou use as setas. Fotos dos destinos; atrações sujeitas ao roteiro.</p></dialog><dialog id="calendar-dialog" class="experience-dialog calendar-dialog" aria-labelledby="calendar-title"><button class="modal-close" aria-label="Fechar calendário">${icon('x')}</button><span class="eyebrow">UMA BOA HISTÓRIA NA SUA AGENDA</span><h2 id="calendar-title">Salve seu próximo passeio</h2><div id="calendar-content"></div><p id="calendar-feedback" role="status"></p></dialog>`);
 const lightbox=document.querySelector<HTMLDialogElement>('#photo-lightbox')!;
 const calendarDialog=document.querySelector<HTMLDialogElement>('#calendar-dialog')!;
 const stage=document.querySelector<HTMLElement>('.lightbox-stage')!;
 const showPhoto=(index:number)=>{
  activePhoto=(index+photos.length)%photos.length;const photo=photos[activePhoto];
  document.querySelector('#lightbox-photo')!.innerHTML=`<img id="lightbox-image" src="${photo.src}" alt="${esc(photo.alt)}" draggable="false" />`;
  document.querySelector('#photo-caption')!.textContent=photo.caption;
  document.querySelector('#photo-counter')!.textContent=`${activePhoto+1} / ${photos.length}`;
 };
 [lightbox,calendarDialog].forEach(dialog=>{
  dialog.querySelector('.modal-close')!.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  dialog.addEventListener('close',()=>{document.body.classList.toggle('modal-open',!!document.querySelector('dialog[open]'));if(dialog===lightbox)openPhotoButton?.focus({preventScroll:true});});
 });
 document.querySelector('.gallery-prev')!.addEventListener('click',()=>showPhoto(activePhoto-1));
 document.querySelector('.gallery-next')!.addEventListener('click',()=>showPhoto(activePhoto+1));
 lightbox.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();showPhoto(activePhoto+(e.key==='ArrowRight'?1:-1));}});
 let pointer:{x:number;y:number;id:number}|null=null;
 stage.addEventListener('pointerdown',e=>{if(e.isPrimary&&!(e.target as Element).closest('button')){pointer={x:e.clientX,y:e.clientY,id:e.pointerId};stage.setPointerCapture(e.pointerId);}});
 stage.addEventListener('pointerup',e=>{if(pointer?.id!==e.pointerId)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;pointer=null;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.3)showPhoto(activePhoto+(dx<0?1:-1));});
 stage.addEventListener('pointercancel',()=>{pointer=null;});
 document.addEventListener('click',e=>{
  const target=(e.target as Element).closest<HTMLElement>('[data-photo],[data-detail-section],[data-calendar]');if(!target)return;
  if(target.dataset.photo!==undefined){openPhotoButton=target;showPhoto(Number(target.dataset.photo));lightbox.showModal();document.body.classList.add('modal-open');}
  if(target.dataset.detailSection){const section=document.getElementById(target.dataset.detailSection);section?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});if(section){section.tabIndex=-1;section.focus({preventScroll:true});}}
  if(target.dataset.calendar){
   const tour=getTours().find(t=>t.id===target.dataset.calendar);if(!tour||!isCalendarDate(tour.date))return;
   const event=calendarEvent(tour);
   const time=new Intl.DateTimeFormat('pt-BR',{timeStyle:'short',timeZone:'America/Sao_Paulo'});
   const fullTime=new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short',timeZone:'America/Sao_Paulo'});
   document.querySelector('#calendar-content')!.innerHTML=`<div class="calendar-summary"><strong>${esc(tour.title)}</strong><span>${dateLabel(tour.date)}</span><p>${event.timed?`Saída prevista: ${time.format(new Date(tour.startsAt!))} · Retorno previsto: ${fullTime.format(new Date(tour.endsAt!))} (horário de Brasília)`:'Horários ainda a confirmar. Será salvo um lembrete de dia inteiro.'}</p><p>${icon('map-pin')}${esc(event.location)}</p></div><div class="calendar-options"><button class="button button-navy" id="download-calendar">${icon('download')} Baixar para meu calendário</button><a class="button calendar-google" href="${esc(googleCalendarUrl(tour))}" target="_blank" rel="noopener noreferrer">Abrir no Google Agenda ${icon('arrow-up-right')}</a></div><p class="detail-note">O arquivo .ics pode ser aberto no Apple Calendário, Outlook e outros aplicativos compatíveis. Salvar a data não confirma sua reserva. Se a programação mudar, atualize o evento salvo.</p>`;
   document.querySelector('#calendar-feedback')!.textContent='';
   document.querySelector('#download-calendar')!.addEventListener('click',()=>{
    const blob=new Blob([createCalendarFile(tour)],{type:'text/calendar;charset=utf-8'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`fran-turismo-${tour.destinationId}-${tour.date}.ics`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);document.querySelector('#calendar-feedback')!.textContent='Arquivo preparado. Abra-o no seu aplicativo de calendário para salvar o lembrete.';
   });
   refreshIcons();calendarDialog.showModal();document.body.classList.add('modal-open');
  }
 });
 refreshIcons();
}
