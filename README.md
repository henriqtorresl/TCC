# TCC - 🩺 Aplicação de Modelos de Linguagem de Grande Escala na Criação de um Assistente de Saúde Virtual

## Sobre o Projeto

Este projeto desenvolve um assistente médico digital capaz de realizar anamneses por meio de chat interativo. Utiliza modelos de IA biomédica para coletar informações do paciente, identificar sintomas e histórico médico, e gerar um resumo clínico estruturado.

## Estrutura do Projeto Real

O projeto principal está localizado na pasta `medico_digital/` e atualmente está estruturado como uma aplicação fullstack em Next.js.

Toda a aplicação (frontend e backend) está unificada no mesmo projeto, seguindo a organização padrão do Next.js.

## Funcionalidades

- Chat interativo para coleta de dados clínicos
- Identificação automática de sintomas e entidades biomédicas
- Geração de histórico clínico estruturado
- Integração com modelos Hugging Face

## Estrutura do Repositório

- `docs/` — Monografia do TCC em LaTeX (template FGA/UnB) e arquivos de compilação.
- `medico_digital/` — Diretório principal contendo todo o código-fonte do projeto.

## Pasta `docs/` (Monografia LaTeX)

A pasta `docs/` concentra o documento acadêmico do TCC migrado para o template novo.

- `docs/latex/tcc.tex` — Arquivo principal da monografia.
- `docs/latex/editaveis/` — Conteúdo editável (introdução, capítulos, resumo, apêndices etc.).
- `docs/latex/fixos/` — Configuração estrutural do template (pacotes, capa, setup).
- `docs/latex/figuras/` — Imagens usadas no documento.
- `docs/latex/bibliografia.bib` — Base bibliográfica.
- `docs/latex/output/` — Artefatos gerados na compilação (incluindo `tcc.pdf`).

### Como compilar

A partir de `docs/`:

```sh
docker compose run --rm latex bash -lc "make clean && make"
```

PDF gerado em:

```txt
docs/latex/output/tcc.pdf
```

## CI/CD

O repositório possui um workflow de integração contínua em [`.github/workflows/ci.yml`](./.github/workflows/ci.yml).

### CI

O pipeline é executado automaticamente em `push` e `pull_request` e faz as seguintes etapas no diretório `medico_digital/`:

1. Checkout do repositório.
2. Configuração do Node.js 20 com cache do `npm`.
3. Instalação das dependências com `npm ci`.
4. Execução do `npm run lint`.
5. Execução do `npm test`.
6. Execução do `npm run build`.

### CD

O CD acontece por meio da configuração do projeto na Vercel.
Todo `push` na branch `main` dispara automaticamente o deploy da aplicação.

URLs públicas:

- Aplicação: [https://medicodigital.vercel.app/](https://medicodigital.vercel.app/)
- Documentação da API: [https://medicodigital.vercel.app/api/docs](https://medicodigital.vercel.app/api/docs)

---
