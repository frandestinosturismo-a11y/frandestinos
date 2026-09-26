export function validarAgenda(saidas, destinos) {
  if (!Array.isArray(saidas)) return ['A agenda precisa ser uma lista de saídas.'];
  const erros = [], ids = new Set();
  saidas.forEach((s, i) => {
    const nome = `Saída ${i + 1}`;
    if (!s || typeof s !== 'object') { erros.push(`${nome}: cadastro inválido.`); return; }
    if (typeof s.id !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(s.id) || ids.has(s.id)) erros.push(`${nome}: identificador inválido ou repetido.`);
    ids.add(s.id);
    if (!destinos.some(d => d.id === s.destinationId)) erros.push(`${nome}: selecione um destino salvo no projeto.`);
    if (typeof s.title !== 'string' || !s.title.trim()) erros.push(`${nome}: preencha o título.`);
    if (s.date !== null && (typeof s.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s.date) || !Number.isFinite(Date.parse(s.date)) || new Date(s.date).toISOString().slice(0, 10) !== s.date)) erros.push(`${nome}: data inválida.`);
    if (s.price !== null && (typeof s.price !== 'number' || !Number.isFinite(s.price) || s.price < 0)) erros.push(`${nome}: informe um preço válido, a partir de zero.`);
    if (s.departure !== null && typeof s.departure !== 'string') erros.push(`${nome}: embarque inválido.`);
  });
  return erros;
}
