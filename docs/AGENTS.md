# AGENTS.md

## Objetivo

Este diretório contém a monografia do TCC em LaTeX. O objetivo deste guia é orientar qualquer
agente a editar o documento com segurança, mantendo a estrutura do projeto, o padrão
acadêmico do texto e o fluxo de compilação já adotado.

## Escopo

As instruções deste arquivo valem para todo o conteúdo dentro de `docs/`.

## Estrutura do projeto

- `latex/tcc.tex`: arquivo principal do documento.
- `latex/editaveis/`: capítulos e conteúdos editáveis da monografia.
- `latex/fixos/`: arquivos estruturais do template.
- `latex/figuras/`: imagens usadas no documento.
- `latex/output/`: artefatos gerados na compilação.
- `docker-compose.yml`: ambiente padrão de compilação.
- `Dockerfile`: imagem usada para gerar o PDF.

## Arquivos editáveis mais importantes

- `latex/editaveis/informacoes.tex`: metadados principais do trabalho.
- `latex/editaveis/resumo.tex`: resumo em português.
- `latex/editaveis/abstract.tex`: abstract em inglês.
- `latex/editaveis/abreviaturas.tex`: lista de siglas.
- `latex/editaveis/introducao.tex`: capítulo de introdução.
- `latex/editaveis/aspectosgerais.tex`: referencial teórico.
- `latex/editaveis/consideracoes.tex`: trabalhos relacionados.
- `latex/editaveis/textoepostexto.tex`: metodologia, desenvolvimento, considerações finais e cronograma.
- `latex/editaveis/apendices.tex`: apêndices e artefatos complementares.

## Arquivos estruturais

- `latex/fixos/informacoes.tex`: define tipo de trabalho, preâmbulo e dados institucionais.
- `latex/fixos/fichaCatalografica.tex`: template da ficha catalográfica.
- `latex/fixos/folhaDeAprovacao.tex`: template da folha de aprovação.
- `latex/fixos/listasAutomaticas.tex`: listas de figuras e tabelas.
- `latex/fixos/indiceAutomatico.tex`: sumário.

## Fluxo de compilação

Compile sempre a partir de `docs/` com:

```sh
docker compose run --rm latex bash -lc "make clean && make"
```

PDF gerado:

```txt
docs/latex/output/TCC_FGA.pdf
```

Também pode existir `docs/latex/output/tcc.pdf` com o mesmo conteúdo gerado.

## Regras de edição

- Edite preferencialmente apenas arquivos dentro de `latex/editaveis/`.
- Só altere arquivos em `latex/fixos/` quando a mudança for realmente estrutural.
- Não reintroduza elementos pré-textuais institucionais incompletos.
- Para a versão atual do TCC1, `ficha catalográfica`, `folha de aprovação` e `agradecimentos`
  devem permanecer omitidos do fluxo principal enquanto não houver dados oficiais.
- Preserve o texto em português formal, acadêmico e direto.
- Evite linguagem promocional, vaga ou excessivamente informal.
- Evite termos problemáticos já criticados no parecer, como:
  - `MVP`
  - `chatbot`
  - `TCC 1` e `TCC 2` como eixo narrativo repetido no corpo do texto
  - `trabalhos futuros`
  - `prova de conceito`, salvo se houver fundamentação explícita
  - `latência aceitável` sem critério definido
- Prefira termos como:
  - `protótipo funcional`
  - `assistente virtual de anamnese`
  - `etapa subsequente do projeto`
  - `avaliação técnica`
  - `códigos-fonte`

## Regras de conteúdo acadêmico

- Objetivos específicos devem ser objetivos de pesquisa e desenvolvimento, não apenas lista de atividades soltas.
- Afirmações quantitativas precisam de referência explícita.
- Quando houver menção a desempenho, latência ou viabilidade, explicitar critério, contexto ou forma de observação.
- Não usar citação integrada de forma inadequada. Evite construções como:
  - `Conforme definido por [Autor, ano]`
  - `A arquitetura X por [Autor, ano]`
- Prefira redações compatíveis com ABNT, por exemplo:
  - `Segundo Autor (ano), ...`
  - `... conforme discutido por Autor (ano).`
  - `... \cite{chave}.`
- Revisar termos ortográficos formais, especialmente compostos e hifenização.

## Convenções atuais do documento

- O capítulo final está concentrado em `latex/editaveis/textoepostexto.tex`.
- O título final adotado é `Considerações Finais e Cronograma`.
- Há um `Plano de Testes` e um `Cronograma de Atividades`.
- Existe definição explícita de `LLM` e `SLM`.
- Os apêndices incluem:
  - especificação da API REST;
  - seção de `Códigos-fonte do Orquestrador (BFF)`;
  - artefatos de testes exploratórios.

## Ao aplicar correções de orientador ou banca

- Primeiro identificar se a correção é:
  - estrutural;
  - textual;
  - metodológica;
  - institucional.
- Mapear a correção ao arquivo correto antes de editar.
- Se a correção for institucional e depender de dado oficial inexistente, não inventar conteúdo.
- Nesse caso, ou omitir o elemento da versão de trabalho, ou deixar claro que depende de preenchimento posterior.
- Após editar, recompilar o PDF e verificar se o texto final reflete a mudança.

## Checklist de validação

Antes de encerrar uma alteração em `docs/`, verificar:

- O documento compila sem erro.
- O PDF foi atualizado em `latex/output/`.
- Não reapareceram placeholders como `Professor Convidado`.
- Não reapareceram termos já removidos por exigência do parecer.
- As seções modificadas continuam coerentes com o sumário.
- Novas tabelas, figuras e citações não quebraram a compilação.

## O que não fazer

- Não preencher nomes fictícios de banca.
- Não afirmar validação experimental robusta quando houver apenas teste exploratório.
- Não trocar termos metodológicos por sinônimos mais fortes sem evidência.
- Não inserir referências inexistentes.
- Não alterar o template estrutural sem necessidade real.
