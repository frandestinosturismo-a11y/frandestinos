# Como atualizar os destinos do site

Este guia é para quem vai cuidar do conteúdo do site **sem mexer em programação**.
Você vai conseguir criar destinos, mudar textos, trocar fotos e excluir o que
não estiver mais disponível.

O site é estático: não existe painel na internet nem banco de dados. O conteúdo
mora em um arquivo do projeto (`public/destinos.json`) e as fotos em uma pasta
(`public/images`). Depois de alterar, é só gerar a pasta de publicação e enviá-la
para a hospedagem.

---

## 1. Antes de começar (uma vez só)

No computador onde o projeto está instalado:

1. Abra o programa **Terminal** na pasta do projeto.
2. Digite e aperte Enter:

   ```sh
   npm install
   ```

Isso baixa o que o projeto precisa. Só é necessário na primeira vez.

---

## 2. Abrir o editor de conteúdo

No Terminal, digite:

```sh
npm run editor
```

O navegador abre a página de edição. Se não abrir sozinho, acesse
<http://localhost:5173/editor/>.

Na tela você encontra:

- **lista dos destinos** à esquerda, na ordem em que aparecem no site;
- **formulário** com todos os campos do destino escolhido;
- **+ Novo destino**, **Excluir destino** e **Salvar alterações**;
- **Como usar**, com estas instruções dentro do próprio editor.

---

## 3. Editar um destino

1. Clique em um destino na lista.
2. Altere os campos que quiser. Os campos com asterisco (**\***) são obrigatórios.
3. Clique em **Salvar alterações**.

Se algum campo obrigatório estiver vazio, o editor avisa antes de gravar e aponta
o que falta. Nada é gravado pela metade.

### O que significa cada campo

| Campo | O que aparece no site |
| --- | --- |
| Nome do destino | Título do cartão e da ficha do destino |
| Identificador no link | Fim do endereço compartilhado, como `?destino=buzios` |
| Região | Linha abaixo do nome, com o ícone de localização |
| Etiqueta do cartão | Selo em cima da foto, como “SOL & MAR” |
| Categorias | Filtros da listagem: Serra & charme, Sol & mar, Cultura & história |
| Ícone | Ícone usado junto ao selo do cartão |
| Resumo do cartão | Frase curta exibida no cartão |
| Descrição completa | Texto da ficha, ao abrir o destino |
| Estilo | Texto curto usado ao comparar destinos |
| Frase de descoberta | Linha de apoio na ficha do destino |
| Inspirações para conhecer | Lista com marcadores na ficha do destino |
| Foto principal | Imagem do cartão e primeira foto da galeria |
| Descrição da foto principal | Texto lido por leitores de tela |
| Galeria | Fotos extras com legenda, com ampliação |
| Itens recomendados | Dicas para a mala (documento, água, calçado e celular já entram sozinhos) |
| Roteiro do dia | As etapas da saída na ordem em que acontecem, com horário, título e descrição |
| Perguntas frequentes | Dúvidas específicas do destino, com a resposta da Fran |

### Sobre o roteiro do dia

Cada destino já vem com quatro etapas preenchidas: **Encontro e embarque**,
**Hora de descobrir o destino**, **Pausa para o almoço** e **Volta para casa**.
Edite os textos, acrescente ou remova etapas conforme a saída.

O campo de **horário** é opcional: enquanto estiver em branco, a ficha do destino
mostra “Horário a confirmar”. Preencha quando a Fran confirmar os horários — a
partir daí a ficha passa a apresentar “Roteiro desta saída”, com os horários
previstos.

---

## 4. Criar um destino novo

1. Clique em **+ Novo destino**. Ele entra na **primeira posição** da lista e já
   vem com o roteiro do dia preenchido.
2. Preencha os campos. O **identificador no link** é gerado a partir do nome, com
   letras minúsculas e hífen (ex.: `arraial-do-cabo`). Pode ajustar se quiser.
3. Coloque a foto na pasta (veja o item 5) e escreva o nome dela no campo
   **Foto principal**.
4. Clique em **Salvar alterações**.
5. Rode `npm run atualizar` e envie a pasta `dist` para a hospedagem.

A **ordem da lista** é a ordem em que os destinos aparecem no site. Use as setas
↑ e ↓ ao lado de cada nome para mudar essa ordem.

## 5. Usar uma foto nova

1. Copie o arquivo da foto para a pasta **`public/images`** do projeto.
2. Prefira nomes simples, em letras minúsculas, sem acento e sem espaço.
   Ex.: `buzios-orla.jpg`.
3. No editor, escreva o nome do arquivo **sem a extensão**: `buzios-orla`.
4. Se for um arquivo `.png` ou `.webp`, escreva o nome **com a extensão**:
   `buzios-orla.png`.

A prévia da foto principal aparece ao lado do campo. Se ela não carregar, o nome
do arquivo ou o local da imagem estão errados.

Dicas para as fotos ficarem boas e o site rápido:

- largura de 1400 a 1600 pixels;
- até cerca de 400 KB por arquivo;
- formato horizontal (deitado).

## 6. Excluir um destino

1. Escolha o destino na lista.
2. Clique em **Excluir destino** e confirme.
3. Clique em **Salvar alterações**.
4. Rode `npm run atualizar`.

Se ainda existir um passeio na agenda apontando para esse destino, o comando
`npm run atualizar` vai avisar. Nesse caso, abra `public/passeios.json` e ajuste
ou remova o passeio indicado.

---

## 7. Publicar as mudanças

No Terminal, na pasta do projeto:

```sh
npm run atualizar
```

Esse comando confere o conteúdo, valida o projeto e gera a pasta **`dist`**.
Depois, envie **todo o conteúdo da pasta `dist`** para a hospedagem (substituindo
o que já está lá). É esse envio que coloca as mudanças no ar.

Se aparecer um aviso de erro, leia a lista apresentada: cada linha diz qual
destino e qual campo precisam de ajuste. Corrija no editor e rode o comando
novamente. Nada é publicado com erro.

### Onde o arquivo é gravado

Quando o editor foi aberto com `npm run editor` (ou `npm run dev`), o botão
**Salvar alterações** grava **direto** em `public/destinos.json`. Nenhuma janela
de arquivos aparece, nada vai para a pasta de downloads, e o editor guarda
automaticamente uma cópia do arquivo anterior dentro de `public/`
(`destinos-copia-...json`, mantendo as 10 mais recentes).

Para desfazer, copie uma dessas cópias sobre `public/destinos.json`.

Se o editor for aberto sem o servidor local, o navegador não consegue gravar no
projeto: nesse caso ele **baixa** um `destinos.json`. Mova esse arquivo para
`public/`, substituindo o que está lá. O caminho recomendado continua sendo
`npm run editor`, em que a gravação é direta.

### Como saber se deu certo

Depois de salvar, o editor mostra a mensagem
“public/destinos.json atualizado…”. E `npm run atualizar` informa quantos destinos
foram encontrados — se o número não subiu depois de você criar um destino, o
arquivo gravado não foi o do projeto.

---

## 8. Perguntas rápidas

**Preciso saber programar?** Não. Você só preenche campos em uma tela e roda um
comando que gera o site.

**Isso muda o site na hora?** Não. O que o visitante vê é a pasta `dist`, que só
é atualizada quando você roda `npm run atualizar` e envia a pasta para a
hospedagem.

**Posso desfazer uma alteração?** Sim. A cada gravação o editor guarda uma cópia
do arquivo anterior em `public/` (`destinos-copia-...json`). Basta copiar a cópia
desejada sobre `public/destinos.json`.

**Quantos destinos posso ter?** Quantos quiser. O quiz do site, os filtros, a
agenda e o rodapé se ajustam automaticamente.

**E se eu errar a mão no arquivo?** O site avisa no console do navegador e mostra
um aviso na área de destinos em vez de ficar em branco. E `npm run conferir`
lista exatamente o que precisa ser corrigido, sem alterar nada.

## Facilidades do painel

- **Buscar destino** filtra por nome ou região; limpe a busca para ver todos.
- Os atalhos acima do formulário levam direto a fotos, textos, roteiro e outras seções.
- **Alterações não salvas** permanece visível no passo 2 até a gravação.
- Você pode alternar entre destinos sem perder o que digitou. Salvar confere todos os cadastros, inclusive os que ficaram incompletos em outra ficha.
- **Conferir site ↗** abre o site local em outra aba. Salve antes para ver os dados atualizados; o mesmo servidor do editor já atende o site, sem precisar executar outro `npm run dev`.
- As cópias de segurança continuam no computador, mas são excluídas da pasta `dist` durante a geração.

Fluxo recomendado: **editar → salvar → conferir site → `npm run atualizar` → enviar o conteúdo de `dist`**. Para conferir exatamente a versão gerada, execute `npm run preview` e abra o endereço informado no terminal.

## Categorias personalizadas e “Guarde a data”

Em **Categorias**, marque as opções desejadas ou escreva um nome em **Categoria personalizada** e clique em **Adicionar categoria**. Você pode combinar várias categorias no mesmo destino. Depois de salvar, as novas categorias utilizadas aparecem nos filtros e no questionário do site. Para deixar de usar uma categoria em um destino, desmarque-a. Uma categoria personalizada deixa de aparecer no site quando nenhum destino a utiliza.

Na ficha de cada destino, a seção **Guarde a data** permite mudar o título, o texto com data confirmada e o texto enquanto a data está pendente. Os textos atuais já vêm preenchidos. Use **Salvar alterações** para gravar esses textos e as categorias.

Abaixo das fichas, em **Agenda · Guarde a data**, as saídas existentes já vêm preenchidas. Você pode editar destino, título, data, local de embarque e preço, adicionar saídas ou remover as que não serão oferecidas. Clique em **Salvar agenda** para gravar em `public/passeios.json`. A agenda tem uma gravação própria, separada da ficha do destino.

- Todo destino salvo aparece automaticamente na agenda pública. Sem uma próxima saída cadastrada, aparece como **EM BREVE**. Para informar a data, adicione uma saída vinculada ao destino em **Agenda · Guarde a data** e clique em **Salvar agenda**.
- Data vazia mantém a indicação de data a confirmar; uma data confirmada habilita o calendário do visitante.
- Preço vazio significa valor não informado; **0** é um valor válido e aparece como R$ 0,00.
- Salve um destino novo antes de clicar em **Nova saída**, para que ele esteja disponível na seleção.
- Saídas com datas passadas não aparecem na agenda pública, mas continuam disponíveis no editor. Se o destino ficar sem próximas saídas, ele aparece como **EM BREVE**.
- Ao mudar a data de uma saída com horários detalhados, esses horários são removidos para evitar um evento de calendário com data antiga. O lembrete passa a ser de dia inteiro.
- Cada gravação da agenda guarda uma cópia `public/passeios-copia-…json` (até 10). Essas cópias não entram na pasta `dist`.

Depois de salvar, confira o site e execute `npm run atualizar` antes de enviar o conteúdo de `dist` à hospedagem.
