# Fran Destinos

Landing page responsiva em português, criada com Vite, TypeScript e CSS. A identidade usa o logo fornecido, azul-marinho, laranja e rosa. Fontes e fotografias são servidas localmente.

## Abrir o projeto

```sh
npm run dev       # abre o site em http://localhost:5173
npm run editor    # abre o editor de conteúdo em /editor/
npm run conferir  # confere os arquivos de conteúdo (campos, ids, fotos)
npm run atualizar # confere o conteúdo, valida o TypeScript e gera dist/
npm run preview   # visualiza a versão de produção
npm run test:e2e  # testes de interação em desktop e celular
```

Os testes usam o Google Chrome instalado. Em um ambiente sem Chrome, instale-o com `npx playwright install chrome` ou ajuste `launchOptions.channel` em `playwright.config.ts` para um navegador disponível.

## Editar o conteúdo (destinos)

Todo o conteúdo de cada destino vive em um único arquivo: **`public/destinos.json`**. Cada item da lista `destinos` reúne nome, região, categorias, textos, fotos, galeria, sugestões para levar e perguntas frequentes. Criar um destino é acrescentar um item; excluir é remover o item. Nenhum código precisa ser alterado.

As fotos ficam em `public/images`. Para usar uma imagem nova, coloque o arquivo nessa pasta e escreva o nome do arquivo (sem `.jpg`) no campo `imagem`. Se o arquivo for `.png` ou `.webp`, escreva o nome com a extensão.

### Com o editor (recomendado para quem não programa)

```sh
npm run editor
```

O editor abre em `http://localhost:5173/editor/` e oferece:

- lista dos destinos na ordem em que aparecem no site, com setas para reordenar;
- formulário com todos os campos, incluindo galeria, sugestões e perguntas frequentes;
- botões para criar e excluir destinos, com confirmação antes de excluir;
- conferência dos campos obrigatórios antes de gravar, com avisos em português;
- gravação direta em `public/destinos.json` (Chrome/Edge), baixando antes uma cópia do arquivo anterior. Em Firefox e Safari o editor baixa o `destinos.json` pronto para substituir o de `public/`.

Depois de gravar, rode `npm run atualizar` e envie o conteúdo da pasta `dist/` para a hospedagem.

### Editando o arquivo à mão

Campos de cada destino em `public/destinos.json`:

- `id`: identificador único usado no link (`?destino=...`); só letras minúsculas, números e hífen.
- `nome`, `regiao`: título do cartão e região exibida.
- `categorias`: uma ou mais entre `serra`, `litoral` e `cultura` (são os filtros da listagem).
- `selo`, `icone`: etiqueta e ícone do cartão (`landmark`, `mountain`, `coffee`, `waves`, `camera` ou `sun`).
- `resumo`: frase curta do cartão. `descricao`: texto completo da ficha do destino.
- `atracoes`: lista de inspirações exibidas nos detalhes.
- `imagem` e `imagemAlt`: foto principal (nome do arquivo em `public/images`) e a descrição para leitores de tela.
- `estilo` e `descoberta`: textos curtos usados no comparador e no resultado do quiz.
- `galeria`: fotos extras com `imagem` e `legenda`.
- `levar`: itens recomendados. Documento, água, calçado confortável e celular carregado já entram automaticamente.
- `perguntas`: pares `pergunta` e `resposta` da ficha do destino.
- `roteiro`: etapas do dia, na ordem, com `horario` (`"07:00"` ou `null`), `titulo` e `descricao`. Horário em branco aparece como “Horário a confirmar”. Quando a saída selecionada na agenda tem `details.itinerary`, esse roteiro tem prioridade sobre o do destino.

Antes de publicar, `npm run conferir` avisa se falta algum campo, se um `id` se repetiu, se alguma foto citada não existe em `public/images` ou se um passeio aponta para um destino que foi removido. O site também continua no ar com um aviso no console e uma mensagem na área de destinos quando o arquivo não puder ser lido.

## Atualizar a agenda

Edite `public/passeios.json`. Cada passeio tem:

- `id`: identificador único.
- `destinationId`: precisa ser igual ao `id` de um destino de `public/destinos.json`.
- `title`: título do passeio.
- `date`: data real em `AAAA-MM-DD`; use `null` enquanto não houver confirmação.
- `departure`: descrição do ponto de embarque ou `null`.
- `price`: preço em reais, como número, ou `null`.

A agenda é carregada desse arquivo. A página gera os filtros de mês automaticamente, ordena as datas, oculta passeios passados e oferece uma consulta pelo WhatsApp quando não há resultados. Os três roteiros iniciais são sugestões em programação; não representam saídas confirmadas. Após atualizar os arquivos, execute um novo build para publicar as mudanças.

## Atualizar os depoimentos

Edite `public/depoimentos.json`. Foram incluídos três relatos fictícios a pedido do usuário, identificados visivelmente como ilustrativos. Para substituir por depoimentos reais autorizados, informe `name`, `destination` e `text` e remova `illustrative: true`. Não remova o rótulo de um relato fictício. Com mais de três relatos, a seção oferece paginação. Com o arquivo vazio, exibe um convite para compartilhar uma experiência.

## WhatsApp

O número está em `src/data.ts`: **+55 21 97217-7007**. Os links abrem o WhatsApp com mensagem preenchida e contexto do destino. A busca também inclui o perfil da viagem quando informado. Nenhuma mensagem é enviada automaticamente e nenhum formulário armazena dados pessoais.

## Fotografias e créditos

Fotos reais de Rio de Janeiro, Petrópolis, Teresópolis, Penedo, Arraial do Cabo e Paraty. Autores, fontes e licenças estão em `public/image-credits.json` e no botão “Créditos das imagens” no rodapé. O logo fornecido foi preservado em `public/images/fran-destinos-logo.png`.

## Publicação

A pasta `dist/`, criada pelo build, pode ser hospedada em um servidor estático. O projeto está preparado para a raiz de um domínio. Antes da publicação, informe as datas e condições efetivas dos passeios. Configure a URL pública da imagem Open Graph quando o domínio for definido. Não há painel administrativo, backend ou confirmação automática de reservas; a equipe atende pelo WhatsApp.

## Redes sociais no rodapé

Instagram e Facebook usam links demonstrativos para a página inicial de cada plataforma, identificados no rodapé. Substitua as URLs de `socialProfiles` em `src/main.ts` pelos perfis oficiais quando estiverem disponíveis. O WhatsApp utiliza o contato real informado.

## Descoberta e experiência de uso

- **Encontre seu passeio:** cenário, ritmo e companhia geram duas sugestões. São inspirações baseadas no conteúdo dos destinos; não indicam disponibilidade de uma saída. As preferências seguem na consulta pelo WhatsApp.
- **Comparação:** selecione até dois destinos para comparar região, estilo e atrações. Limpar remove a seleção.
- **Compartilhamento:** usa o compartilhamento nativo quando disponível, depois tenta copiar o link e, se necessário, oferece um campo para cópia manual. Links como `/?destino=penedo` abrem os detalhes do destino. O domínio usado é o endereço atual do site — para compartilhar externamente, abra pela URL pública/ngrok antes de copiar.
- **Consulta personalizada:** nos detalhes, quantidade de pessoas e preferência de embarque são opcionais. A mensagem é preparada para o WhatsApp; o site não envia mensagens nem confirma reservas.
- **Próximas datas:** o botão solicita à equipe informações e acompanhamento por WhatsApp. Não há inscrição automática em notificações.
- **Acessibilidade e celular:** controles com rótulos, foco de teclado e estados de seleção; animações respeitam a preferência por movimento reduzido. No celular, o contato permanece no cabeçalho e o botão flutuante é ocultado para preservar a leitura. No computador, ele também se oculta quando o rodapé ou a barra de comparação estão em uso.

A implementação desses recursos está em `src/experience.ts`, com os refinamentos em `src/experience.css`. Os testes de fluxos estão em `tests/experience.spec.ts`.

## Roteiro, informações práticas, galeria e calendário

Os detalhes de cada destino agora oferecem três fotos reais com ampliação, setas, teclado e gesto horizontal; uma linha do tempo; informações de inclusões, extras, caminhadas, acessibilidade e itens para levar; e perguntas específicas do destino. As 18 fotografias e suas licenças constam no arquivo de créditos.

Sem informações reais da operadora, a linha do tempo é explicitamente **ilustrativa**, com horários a confirmar. Os cartões não prometem ingressos, transporte, acessibilidade ou atividades sem confirmação. Os textos gerais e as sugestões de itens estão em `src/travel-data.ts`; galerias, sugestões específicas e perguntas frequentes de cada destino ficam em `public/destinos.json`.

Para publicar a programação de uma saída, adicione os campos opcionais abaixo ao respectivo objeto de `public/passeios.json`. O exemplo a seguir é fictício, apenas para documentar o formato; ele não foi adicionado à agenda pública:

```json
{
  "id": "exemplo-penedo",
  "destinationId": "penedo",
  "title": "Exemplo de saída — substituir pelos dados reais",
  "date": "2099-11-15",
  "departure": "Ponto de embarque confirmado pela operadora",
  "price": null,
  "startsAt": "2099-11-15T07:00:00-03:00",
  "endsAt": "2099-11-15T19:00:00-03:00",
  "details": {
    "itinerary": [
      { "time": "07:00", "title": "Embarque", "description": "Orientação de encontro confirmada pela equipe." },
      { "time": "12:00", "title": "Almoço", "description": "Descrever a parada e a condição real da refeição." },
      { "time": "19:00", "title": "Retorno previsto", "description": "Horário estimado a confirmar com a equipe." }
    ],
    "included": ["Listar somente os itens confirmados nesta saída"],
    "extras": ["Listar os gastos adicionais efetivos"],
    "walking": "Descrever distância, duração, intensidade e pausas do roteiro real.",
    "accessibility": "Informar as condições efetivas de veículo e paradas.",
    "bring": ["Itens recomendados para esta saída"],
    "faq": [{ "question": "Pergunta específica da saída", "answer": "Resposta confirmada pela equipe." }]
  }
}
```

Quando há várias saídas para o mesmo destino, o visitante escolhe a saída nos detalhes. Roteiro, condições, calendário e mensagem de WhatsApp passam a corresponder àquela seleção. Campos ausentes continuam com indicação de confirmação; não são copiados de outra saída.

O calendário fica disponível na agenda e nos detalhes **somente quando há data válida**. `startsAt` e `endsAt` devem ter data, hora e deslocamento de fuso explícito. Com ambos válidos e em ordem, o evento tem horários; caso contrário, salva-se um lembrete de dia inteiro, sem inventar horários. A tela informa esse comportamento. Embarque e contato acompanham o evento.

A opção de download gera `.ics`; o botão Google Agenda abre a criação do evento na conta do visitante, sem enviar convites. Salvar não confirma reserva nem sincroniza alterações posteriores. A implementação segue [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545), com data final exclusiva, conversão para UTC, escape de texto e quebra de linhas por bytes UTF-8. Testes verificam o arquivo gerado e os links; não foi realizada importação em aplicativos pessoais de calendário.

## Direção visual: caderno de viagens

A camada `src/editorial.css` organiza o visual de revista: papel claro e títulos amplos, azul-marinho na estrutura, laranja nas ações e rosa nas memórias. Uma composição assimétrica de fotografias abre os detalhes dos destinos; carimbos e percursos pontilhados são decorativos. A agenda usa cartões inspirados em bilhetes, com data, destino e embarque, sem representar reserva emitida. Os depoimentos recebem molduras de cartões-postais com imagens dos destinos e mantêm seus rótulos de conteúdo ilustrativo.

A composição se adapta ao celular, preserva os controles existentes e respeita a preferência por movimento reduzido.
