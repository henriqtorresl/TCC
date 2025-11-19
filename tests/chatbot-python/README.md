# chatbot-python

Este projeto utiliza Poetry e pyenv para gerenciar dependências e versões do Python.

## Como configurar e rodar o ambiente

Este projeto utiliza [Poetry](https://python-poetry.org/) para gerenciar dependências e [pyenv](https://github.com/pyenv/pyenv) para gerenciar versões do Python.

### 1. Instale o Python com pyenv

```sh
pyenv install 3.10.9
pyenv local 3.10.9
```

### 2. Instale o Poetry

Siga as instruções oficiais: https://python-poetry.org/docs/#installation

### 3. Instale as dependências do projeto

```sh
poetry install
```

### 4. Ative o ambiente virtual

```sh
poetry shell
```

### 5. Execute o projeto

Por exemplo, para rodar o app principal:

```sh
streamlit run app.py
```

Ou rode scripts Python normalmente:

```sh
python app.py
```

### 6. Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto para definir variáveis de ambiente necessárias.

---

Adicione aqui informações sobre o seu projeto chatbot-python.
