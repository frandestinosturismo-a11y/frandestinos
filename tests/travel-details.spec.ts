import {test,expect} from '@playwright/test';
import {createCalendarFile,googleCalendarUrl} from '../src/calendar';
import type {Tour} from '../src/data';
const timed:Tour={id:'penedo-timed',destinationId:'penedo',title:'Penedo especial',date:'2099-11-15',departure:'Tijuca, praça; portão 2',price:150,startsAt:'2099-11-15T07:00:00-03:00',endsAt:'2099-11-15T19:00:00-03:00',details:{itinerary:[{time:'07:00',title:'Embarque na Tijuca',description:'Encontro no ponto informado.'},{time:'12:00',title:'Almoço',description:'Pausa programada.'}],included:['Transporte nesta saída'],extras:['Almoço não incluído'],walking:'Caminhada leve com pausas.',accessibility:'Confirmar adaptação do veículo.',bring:['Documento','Água'],faq:[{question:'Qual é a parada desta saída?',answer:'Parada definida no centro.'}]}};

test('gallery loads real photos, supports arrows, swipe and closes back to details',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/?destino=petropolis');
 await expect(page.locator('.gallery-thumbnails button')).toHaveCount(3);
 await page.locator('.gallery-thumbnails button').nth(1).click();
 await expect(page.locator('#photo-lightbox')).toBeVisible();
 await expect(page.locator('#photo-counter')).toHaveText('2 / 3');
 await expect(page.locator('#photo-caption')).toContainText('Palácio de Cristal');
 await page.waitForFunction(()=>{const img=document.querySelector<HTMLImageElement>('#lightbox-image');return img?.complete&&img.naturalWidth>0});
 await page.getByRole('button',{name:'Próxima foto',exact:true}).click();
 await expect(page.locator('#photo-counter')).toHaveText('3 / 3');
 await page.keyboard.press('ArrowRight');
 await expect(page.locator('#photo-counter')).toHaveText('1 / 3');
 const box=(await page.locator('#lightbox-image').boundingBox())!;
 await page.mouse.move(box.x+box.width*.7,box.y+box.height*.6);await page.mouse.down();await page.mouse.move(box.x+box.width*.2,box.y+box.height*.6,{steps:8});await page.mouse.up();
 await expect(page.locator('#photo-counter')).toHaveText('2 / 3');
 await page.keyboard.press('Escape');
 await expect(page.locator('#photo-lightbox')).toBeHidden();
 await expect(page.getByRole('dialog',{name:'Petrópolis',exact:true})).toBeVisible();
 await expect(page.locator('body')).toHaveClass(/modal-open/);
 expect(errors).toEqual([]);
});

test('pending tour shows illustrative timeline, practical facts, FAQs and no calendar event',async({page})=>{
 await page.goto('/?destino=penedo');
 await expect(page.locator('.trip-timeline li')).toHaveCount(4);
 await expect(page.locator('#trip-itinerary')).toContainText('Sequência ilustrativa');
 // O roteiro vem preenchido em public/destinos.json e é editável sem código.
 await expect(page.locator('.trip-timeline')).toContainText('Encontro e embarque');
 await expect(page.locator('.trip-timeline')).toContainText('Hora de descobrir o destino');
 await expect(page.locator('.trip-timeline')).toContainText('Pausa para o almoço');
 await expect(page.locator('.trip-timeline')).toContainText('Volta para casa');
 await expect(page.locator('#trip-itinerary')).toContainText('Horário a confirmar');
 await expect(page.locator('#trip-practical')).toContainText('Itens incluídos a confirmar');
 await expect(page.locator('#trip-practical')).toContainText('Intensidade ainda não informada');
 await expect(page.locator('.packing-list')).toContainText('Documento');
 await page.locator('#trip-faq').getByText('Vamos visitar cachoeiras?',{exact:true}).click();
 await expect(page.locator('#trip-faq details[open]')).toContainText('não está confirmada');
 await expect(page.locator('.detail-calendar [data-calendar]')).toHaveCount(0);
 await expect(page.locator('.calendar-pending')).toContainText('Aguardando');
 await page.locator('.modal-close[aria-label="Fechar detalhes"]').click();
 await expect(page.locator('#destination-modal')).toBeHidden();
});

test('selecting a dated departure shows only its itinerary and exports calendar',async({page})=>{
 await page.route('**/passeios.json',route=>route.fulfill({json:[timed,{...timed,id:'penedo-other',title:'Outra saída',date:'2099-12-20',startsAt:undefined,endsAt:undefined,details:undefined}]}));
 await page.goto('/?destino=penedo');
 await expect(page.locator('#detail-tour-select option')).toHaveCount(3);
 await page.locator('#detail-tour-select').selectOption(timed.id);
 await expect(page.locator('#trip-itinerary')).toContainText('Roteiro desta saída');
 await expect(page.locator('.trip-timeline li')).toHaveCount(2);
 await expect(page.locator('#trip-practical')).toContainText('Transporte nesta saída');
 await expect(page.locator('#trip-faq')).toContainText('Qual é a parada desta saída?');
 let message=new URL((await page.locator('#consult-link').getAttribute('href'))!).searchParams.get('text');
 expect(message).toContain('15 de novembro de 2099');
 await page.locator('.detail-calendar [data-calendar]').click();
 await expect(page.locator('#calendar-dialog')).toBeVisible();
 await expect(page.locator('.calendar-summary')).toContainText('07:00');
 await expect(page.locator('.calendar-summary')).toContainText('Tijuca');
 const google=new URL((await page.getByRole('link',{name:'Abrir no Google Agenda'}).getAttribute('href'))!);
 expect(google.searchParams.get('dates')).toBe('20991115T100000Z/20991115T220000Z');
 const downloadPromise=page.waitForEvent('download');await page.locator('#download-calendar').click();const download=await downloadPromise;
 expect(download.suggestedFilename()).toBe('fran-turismo-penedo-2099-11-15.ics');
 const stream=await download.createReadStream();let content='';for await(const chunk of stream!)content+=chunk.toString();
 expect(content).toContain('DTSTART:20991115T100000Z');expect(content).toContain('DTEND:20991115T220000Z');
 expect(content.replace(/\r\n /g,'')).toContain('97217-7007');
 await page.getByRole('button',{name:'Fechar calendário'}).click();
 await page.locator('#detail-tour-select').selectOption('penedo-other');
 await expect(page.locator('#trip-itinerary')).toContainText('Sequência ilustrativa');
 await expect(page.locator('#trip-practical')).not.toContainText('Transporte nesta saída');
 message=new URL((await page.locator('#consult-link').getAttribute('href'))!).searchParams.get('text');expect(message).toContain('20 de dezembro de 2099');
 await page.locator('.detail-calendar [data-calendar]').click();await expect(page.locator('.calendar-summary')).toContainText('dia inteiro');
 await page.getByRole('button',{name:'Fechar calendário'}).click();
 await page.locator('#detail-tour-select').selectOption('');
 await expect(page.locator('.detail-calendar [data-calendar]')).toHaveCount(0);
});

test('iCalendar escapes text, folds UTF-8 and handles day/month boundaries',()=>{
 const tour={...timed,id:'teste',title:'Excursão, café; coração '.repeat(12),date:'2099-12-31',startsAt:undefined,endsAt:undefined,departure:'Praça, centro; portão 2\nEncontro'};
 const ics=createCalendarFile(tour,new Date('2026-09-25T12:00:00Z'));const unfolded=ics.replace(/\r\n /g,'');
 expect(ics).toContain('DTSTART;VALUE=DATE:20991231');expect(ics).toContain('DTEND;VALUE=DATE:21000101');
 expect(unfolded).toContain('LOCATION:Praça\\, centro\\; portão 2\\nEncontro');
 expect(unfolded).toContain('SUMMARY:Fran Turismo — Excursão\\, café\\; coração');
 for(const line of ics.split('\r\n'))expect(Buffer.byteLength(line,'utf8')).toBeLessThanOrEqual(75);
 expect(new URL(googleCalendarUrl(tour)).searchParams.get('dates')).toBe('20991231/21000101');
 expect(()=>createCalendarFile({...tour,date:null})).toThrow();expect(()=>createCalendarFile({...tour,date:'2099-02-30'})).toThrow();
 const fallback=createCalendarFile({...timed,endsAt:'2099-11-15T06:00:00-03:00'});expect(fallback).toContain('DTSTART;VALUE=DATE:20991115');
});
