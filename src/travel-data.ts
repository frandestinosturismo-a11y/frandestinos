// Os detalhes de cada destino agora vivem em public/destinos.json e são
// lidos por src/catalog.ts. Este arquivo permanece só para tipos e atalhos.
export type { Photo, TripFacts, TripQuestion, TripStep, TravelProfile } from './catalog';
export { travelProfile } from './catalog';
