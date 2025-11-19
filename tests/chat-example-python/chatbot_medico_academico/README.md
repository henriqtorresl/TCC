# Chatbot Médico Acadêmico

Este projeto é um exemplo de chatbot médico acadêmico em Python.

## Requisitos

- Python 3.10.9
- [pyenv](https://github.com/pyenv/pyenv) (opcional, recomendado para gerenciar versões do Python)

## Configuração do Ambiente

### Usando pyenv (recomendado)

1. Instale o pyenv:
   ```zsh
   brew install pyenv
   ```
2. Instale a versão do Python definida em `.python-version`:
   ```zsh
   pyenv install $(cat .python-version)
   ```
3. Defina a versão local do Python:
   ```zsh
   pyenv local $(cat .python-version)
   ```
4. Crie o ambiente virtual:
   ```zsh
   python -m venv venv
   ```
5. Ative o ambiente virtual:
   ```zsh
   source venv/bin/activate
   ```

### Usando apenas a versão correta do Python

1. Certifique-se de ter o Python 3.10.9 instalado (verifique com `python --version`).
2. Crie o ambiente virtual:
   ```zsh
   python -m venv venv
   ```
3. Ative o ambiente virtual:
   ```zsh
   source venv/bin/activate
   ```

## Instalação das Dependências

Com o ambiente virtual ativado, instale as dependências:

```zsh
pip install -r requirements.txt
```

## Como Rodar o Projeto

Execute o script desejado, por exemplo:

```zsh
python chatbot_medico_academico/ner_teste.py
```

## Estrutura do Projeto

```
chatbot_medico_academico/
├── ner_teste.py
├── requirements.txt
└── .python-version
```

## Observações

- Recomenda-se usar o pyenv para evitar conflitos de versões.
- Sempre ative o ambiente virtual antes de instalar dependências ou rodar scripts.
