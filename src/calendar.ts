import { destinations, whatsapp, type Tour } from './data';
// RFC 5545: date-valued DTEND is exclusive; content lines fold at 75 UTF-8 octets.
// https://www.rfc-editor.org/rfc/rfc5545
const text = (value: string) => value.replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
const stamp = (date: Date) => date.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
const fold = (line: string) => {
 let output='', part='', bytes=0;
 for(const char of line){const length=new TextEncoder().encode(char).length;if(bytes+length>75){output+=part+'\r\n';part=' ';bytes=1;}part+=char;bytes+=length;}
 return output+part;
};
export function isCalendarDate(value: unknown): value is string {
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const date=new Date(value+'T12:00:00Z');return !Number.isNaN(date.getTime())&&date.toISOString().slice(0,10)===value;
}
const validTimestamp=(value: unknown): value is string => typeof value==='string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$/.test(value) && isCalendarDate(value.slice(0,10)) && !Number.isNaN(new Date(value).getTime());
export function calendarEvent(tour: Tour) {
 if(!isCalendarDate(tour.date))throw new Error('Este passeio ainda não tem uma data válida.');
 const timed=validTimestamp(tour.startsAt)&&validTimestamp(tour.endsAt)&&tour.startsAt.slice(0,10)===tour.date&&new Date(tour.endsAt)>new Date(tour.startsAt);
 const next=new Date(tour.date+'T12:00:00Z');next.setUTCDate(next.getUTCDate()+1);
 const start=timed?stamp(new Date(tour.startsAt!)):tour.date.replace(/-/g,'');
 const end=timed?stamp(new Date(tour.endsAt!)):next.toISOString().slice(0,10).replace(/-/g,'');
 const location=tour.departure?.trim()||'Ponto de embarque a confirmar com a Fran Destinos';
 const destination=destinations.find(d=>d.id===tour.destinationId)?.nome??tour.destinationId;
 const description=[`Destino: ${destination}`,`Embarque: ${location}`,timed?'Horários previstos na programação. Confirme-os com a equipe.':'Horários a confirmar. Este lembrete ocupa o dia inteiro.', 'Fran Destinos · WhatsApp: +55 21 97217-7007',whatsapp(`Olá, Fran! Salvei o passeio ${tour.title} (${tour.date}) no calendário e quero confirmar os detalhes.`),'Salvar este lembrete não confirma uma reserva. Alterações no site não atualizam automaticamente o evento salvo.'].join('\n');
 return {timed,start,end,location,description,title:`Fran Destinos — ${tour.title}`};
}
export function createCalendarFile(tour: Tour, now=new Date()): string {
 const event=calendarEvent(tour);
 const uid=`${encodeURIComponent(tour.id)}-${tour.date}@fran-turismo.local`;
 return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Fran Destinos//Passeios//PT-BR','CALSCALE:GREGORIAN','BEGIN:VEVENT',`UID:${uid}`,`DTSTAMP:${stamp(now)}`,`DTSTART${event.timed?'':';VALUE=DATE'}:${event.start}`,`DTEND${event.timed?'':';VALUE=DATE'}:${event.end}`,`SUMMARY:${text(event.title)}`,`DESCRIPTION:${text(event.description)}`,`LOCATION:${text(event.location)}`,'TRANSP:TRANSPARENT','END:VEVENT','END:VCALENDAR'].map(fold).join('\r\n')+'\r\n';
}
export function googleCalendarUrl(tour: Tour) {
 const event=calendarEvent(tour);
 const url=new URL('https://calendar.google.com/calendar/render');
 url.search=new URLSearchParams({action:'TEMPLATE',text:event.title,dates:`${event.start}/${event.end}`,details:event.description,location:event.location,ctz:'America/Sao_Paulo'}).toString();
 return url.href;
}
