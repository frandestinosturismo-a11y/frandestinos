// Camada única de conteúdo: lê public/destinos.json e entrega os dados já
// validados para o resto do site. Editar destinos é mexer apenas no JSON.

export type Category = string;
export type DestinationIcon = 'landmark' | 'mountain' | 'coffee' | 'waves' | 'camera' | 'sun';

export interface Photo { src: string; alt: string; caption: string; }
export interface TripStep { time: string | null; title: string; description: string; }
export interface TripQuestion { question: string; answer: string; }

/** Fatos publicados para uma saída específica (opcional em passeios.json). */
export interface TripFacts {
  itinerary?: TripStep[];
  included?: string[];
  extras?: string[];
  walking?: string;
  accessibility?: string;
  bring?: string[];
  faq?: TripQuestion[];
}

export interface GalleryItem { imagem: string; legenda: string; }
export interface RawQuestion { pergunta: string; resposta: string; }
export interface RoteiroStep { horario?: string | null; titulo: string; descricao: string; }

/** Formato de um destino dentro de public/destinos.json. */
export interface RawDestination {
  id: string;
  nome: string;
  regiao: string;
  categorias: string[];
  selo?: string;
  icone?: string;
  resumo: string;
  descricao: string;
  atracoes?: string[];
  imagem: string;
  imagemAlt?: string;
  estilo?: string;
  descoberta?: string;
  galeria?: GalleryItem[];
  levar?: string[];
  perguntas?: RawQuestion[];
  roteiro?: RoteiroStep[];
  calendario?: { titulo: string; confirmado: string; pendente: string };
}

/** Destino já conferido, com campos opcionais preenchidos. */
export interface Destination extends RawDestination {
  selo: string;
  icone: DestinationIcon;
  atracoes: string[];
  imagemAlt: string;
  estilo: string;
  descoberta: string;
  galeria: GalleryItem[];
  levar: string[];
  perguntas: RawQuestion[];
  roteiro: RoteiroStep[];
}

export interface TravelProfile {
  gallery: Photo[];
  discovery: string;
  bring: string[];
  faq: TripQuestion[];
  /** Roteiro do dia já preenchido no arquivo de conteúdo. */
  itinerary: TripStep[];
}

export const ICON_OPTIONS: { value: DestinationIcon; label: string }[] = [
  { value: 'landmark', label: 'Monumento / história' },
  { value: 'mountain', label: 'Montanha / serra' },
  { value: 'coffee', label: 'Café / gastronomia' },
  { value: 'waves', label: 'Praia / mar' },
  { value: 'camera', label: 'Cultura / fotografia' },
  { value: 'sun', label: 'Sol / cidade' },
];
export const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: 'serra', label: 'Serra & charme' },
  { value: 'litoral', label: 'Sol & mar' },
  { value: 'cultura', label: 'Cultura & história' },
];

const ICON_NAMES: string[] = ICON_OPTIONS.map(option => option.value);
export const categoryLabel = (value: string): string => CATEGORY_OPTIONS.find(option => option.value === value)?.label ?? value;
export const categoryOptions = () => [...new Set([...CATEGORY_OPTIONS.map(option => option.value), ...destinations.flatMap(d => d.categorias)])].map(value => ({ value, label: categoryLabel(value) }));
const IMAGE_NAME = /^[a-z0-9][a-z0-9-]*$/;
export const CATALOG_PATH = '/destinos.json';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');
const textList = (value: unknown): string[] => (Array.isArray(value) ? value.map(text).filter(Boolean) : []);
/** Aceita "foto", "/images/foto.jpg" ou "foto.jpg" e preserva extensões explícitas. */
const imageName = (value: unknown): string =>
  text(value).replace(/^\/?images\//, '');

// Itens que valem para qualquer passeio ficam fora do JSON para o conteúdo
// seguir enxuto; entram automaticamente na lista de sugestões de cada destino.
const itensEssenciais = ['Documento de identificação', 'Garrafa de água', 'Calçado confortável', 'Celular carregado'];

export const rawDestinationsFrom = (data: unknown): RawDestination[] => {
  const list = isRecord(data) ? data.destinos : undefined;
  return Array.isArray(list) ? (list.filter(isRecord) as unknown as RawDestination[]) : [];
};

/** Erros de preenchimento do JSON, em português, prontos para exibir a quem edita. */
export function validateCatalog(entries: RawDestination[]): string[] {
  const problems: string[] = [];
  if (!entries.length) problems.push('Nenhum destino foi encontrado. O arquivo precisa ter a lista "destinos" com pelo menos um item.');
  const seen = new Set<string>();
  entries.forEach((entry, index) => {
    const label = text(entry?.nome) || `Destino nº ${index + 1}`;
    const id = text(entry?.id);
    if (!id) problems.push(`${label}: falta o campo "id" (identificador único, sem espaços).`);
    else if (!IMAGE_NAME.test(id)) problems.push(`${label}: o "id" deve usar apenas letras minúsculas, números e hífen.`);
    else if (seen.has(id)) problems.push(`${label}: o "id" ${id} está repetido. Cada destino precisa de um id diferente.`);
    else seen.add(id);
    if (!text(entry?.nome)) problems.push(`${label}: falta o "nome" do destino.`);
    if (!text(entry?.regiao)) problems.push(`${label}: falta a "regiao".`);
    if (!text(entry?.resumo)) problems.push(`${label}: falta o "resumo" (a frase que aparece no cartão).`);
    if (!text(entry?.descricao)) problems.push(`${label}: falta a "descricao" (o texto completo dos detalhes).`);
    if (!imageName(entry?.imagem)) problems.push(`${label}: falta a "imagem" principal.`);
    else if (!IMAGE_NAME.test(imageName(entry?.imagem).replace(/\.(?:jpe?g|png|webp)$/i, ''))) problems.push(`${label}: o nome da imagem principal deve usar apenas letras minúsculas, números e hífen.`);
    const categorias = Array.isArray(entry?.categorias) ? entry.categorias : [];
    if (!categorias.length) problems.push(`${label}: escolha ao menos uma categoria.`);
    categorias.forEach(categoria => {
      if (typeof categoria !== 'string' || !categoria.trim() || categoria.length > 60 || categoria === 'all') problems.push(`${label}: use categorias com 1 a 60 caracteres ("all" é reservado).`);
    });
    if (entry?.icone && !ICON_NAMES.includes(entry.icone as DestinationIcon)) problems.push(`${label}: o ícone "${entry.icone}" não existe. Use ${ICON_NAMES.join(', ')}.`);
    if (entry?.galeria && !Array.isArray(entry.galeria)) problems.push(`${label}: a "galeria" precisa ser uma lista de fotos.`);
    (Array.isArray(entry?.galeria) ? entry.galeria : []).forEach((item, photoIndex) => {
      if (!imageName(item?.imagem)) problems.push(`${label}: a foto nº ${photoIndex + 1} da galeria está sem o nome do arquivo.`);
      if (!text(item?.legenda)) problems.push(`${label}: a foto nº ${photoIndex + 1} da galeria está sem legenda.`);
    });
    (Array.isArray(entry?.perguntas) ? entry.perguntas : []).forEach((item, questionIndex) => {
      if (!text(item?.pergunta)) problems.push(`${label}: a pergunta nº ${questionIndex + 1} está sem enunciado.`);
      if (!text(item?.resposta)) problems.push(`${label}: a pergunta nº ${questionIndex + 1} está sem resposta.`);
    });
    (Array.isArray(entry?.roteiro) ? entry.roteiro : []).forEach((item, stepIndex) => {
      if (!text(item?.titulo)) problems.push(`${label}: a etapa nº ${stepIndex + 1} do roteiro está sem título.`);
      if (!text(item?.descricao)) problems.push(`${label}: a etapa nº ${stepIndex + 1} do roteiro está sem descrição.`);
    });
  });
  return problems;
}

export function normalizeDestination(entry: RawDestination): Destination {
  const galeria = (Array.isArray(entry.galeria) ? entry.galeria : [])
    .map(item => ({ imagem: imageName(item?.imagem), legenda: text(item?.legenda) }))
    .filter(item => item.imagem);
  const perguntas = (Array.isArray(entry.perguntas) ? entry.perguntas : [])
    .map(item => ({ pergunta: text(item?.pergunta), resposta: text(item?.resposta) }))
    .filter(item => item.pergunta || item.resposta);
  const roteiro = (Array.isArray(entry.roteiro) ? entry.roteiro : [])
    .map(item => ({ horario: text(item?.horario) || null, titulo: text(item?.titulo), descricao: text(item?.descricao) }))
    .filter(item => item.titulo || item.descricao);
  const nome = text(entry.nome);
  return {
    id: text(entry.id),
    nome,
    regiao: text(entry.regiao),
    categorias: textList(entry.categorias),
    selo: text(entry.selo),
    icone: ICON_NAMES.includes(entry.icone as DestinationIcon) ? (entry.icone as DestinationIcon) : 'camera',
    resumo: text(entry.resumo),
    descricao: text(entry.descricao),
    atracoes: textList(entry.atracoes),
    imagem: imageName(entry.imagem),
    imagemAlt: text(entry.imagemAlt) || nome,
    estilo: text(entry.estilo) || text(entry.resumo),
    descoberta: text(entry.descoberta) || nome,
    galeria,
    levar: textList(entry.levar),
    perguntas,
    roteiro,
    calendario: entry.calendario,
  };
}

/** Lista de destinos pronta para uso. Fica vazia até loadCatalog() responder. */
export const destinations: Destination[] = [];
let byId = new Map<string, Destination>();

export interface CatalogLoad {
  ok: boolean;
  /** Mensagem pronta para exibir ao visitante quando não foi possível carregar. */
  error?: string;
  /** Problemas de preenchimento do arquivo, para o console e para o build. */
  problems: string[];
}

/**
 * Lê public/destinos.json, confere o preenchimento e publica a lista.
 * Em caso de falha o site continua no ar, com a lista vazia e um aviso claro.
 */
export async function loadCatalog(): Promise<CatalogLoad> {
  let data: unknown;
  try {
    const response = await fetch(CATALOG_PATH, { cache: 'no-cache' });
    if (!response.ok) throw new Error(String(response.status));
    data = await response.json();
  } catch {
    const error = 'Não foi possível carregar os destinos agora. Tente recarregar a página ou fale com a Fran pelo WhatsApp.';
    console.error(`[${CATALOG_PATH}] falha ao ler o arquivo de destinos.`);
    return { ok: false, error, problems: [] };
  }
  const raw = rawDestinationsFrom(data);
  const problems = validateCatalog(raw);
  const normalized = raw.map(normalizeDestination).filter(destination => destination.id && destination.nome);
  destinations.length = 0;
  destinations.push(...normalized);
  byId = new Map(destinations.map(destination => [destination.id, destination]));
  if (problems.length) console.error(`[${CATALOG_PATH}] Corrija os campos abaixo:\n- ` + problems.join('\n- '));
  if (!normalized.length) {
    const error = 'Os destinos ainda não estão publicados. Fale com a Fran para conhecer as próximas saídas.';
    return { ok: false, error, problems };
  }
  return { ok: true, problems };
}

export const destinationById = (id: string): Destination | undefined => byId.get(id);
export const destinationName = (id: string): string => byId.get(id)?.nome ?? '';

const imagePath = (name: string): string => (/\.(?:jpe?g|png|webp)$/i.test(name) ? `/images/${name}` : `/images/${name}.jpg`);
export const destinationImage = (destination: Destination): string => imagePath(destination.imagem);
export const galleryImage = (item: GalleryItem): string => imagePath(item.imagem);

/** Perfil de viagem do destino: galeria completa, sugestões e dúvidas frequentes. */
export function travelProfile(id: string): TravelProfile {
  const destination = byId.get(id);
  if (!destination) return { gallery: [], discovery: '', bring: [], faq: [], itinerary: [] };
  return {
    gallery: [
      { src: destinationImage(destination), alt: destination.imagemAlt, caption: destination.imagemAlt },
      ...destination.galeria.map(item => ({ src: galleryImage(item), alt: item.legenda, caption: item.legenda })),
    ],
    discovery: destination.descoberta,
    bring: [...itensEssenciais, ...destination.levar],
    faq: destination.perguntas.map(item => ({ question: item.pergunta, answer: item.resposta })),
    itinerary: destination.roteiro.map(step => ({ time: step.horario ?? null, title: step.titulo, description: step.descricao })),
  };
}
