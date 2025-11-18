import torch
from transformers import pipeline, AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
from langchain_huggingface import HuggingFacePipeline
from langchain.memory import ConversationBufferWindowMemory
from langchain.agents import AgentExecutor, create_react_agent 
from langchain_core.tools import Tool, BaseTool
from langchain_core.prompts import PromptTemplate
# -----------------------------------------------

print("Iniciando o Chatbot de Anamnese v1.0...")

# --- BLOCO 1: CARREGAR O "OUVIDO" (FERRAMENTA NER) ---

print("Carregando Ferramenta 1: Modelo NER (Ouvido)...")

# Primeiro, definimos a função que o agente irá chamar
def analisar_sintomas(texto: str) -> str:
    """
    Usa um modelo NER para analisar o texto do paciente e extrair
    entidades clínicas como 'PROBLEMA', 'TRATAMENTO' ou 'TESTE'.
    Retorna uma string formatada com as entidades encontradas.
    """
    try:
        # Carregamos o pipeline NER que já testamos
        # (Usamos um 'singleton' para não carregar o modelo toda vez)
        if not hasattr(analisar_sintomas, "ner_pipeline"):
            ner_model_id = "HUMADEX/portugese_medical_ner"
            analisar_sintomas.ner_pipeline = pipeline(
                "ner",
                model=ner_model_id,
                aggregation_strategy="simple"
            )
            print(f"Modelo NER {ner_model_id} carregado.")

        # Executa a análise
        resultados_ner = analisar_sintomas.ner_pipeline(texto)
        
        if not resultados_ner:
            return "Nenhuma entidade clínica detectada."

        # Formata a saída para ser fácil para o LLM entender
        entidades_formatadas = []
        for entidade in resultados_ner:
            texto_entidade = entidade['word']
            tipo_entidade = entidade['entity_group']
            score = entidade['score']
            # Filtramos ruídos (ex: 'a' como 'PROBLEM')
            if len(texto_entidade) > 1 and score > 0.6:
                entidades_formatadas.append(f"[{tipo_entidade}: {texto_entidade}]")
        
        if not entidades_formatadas:
            return "Nenhuma entidade clínica relevante detectada (score > 0.6)."

        return "Entidades extraídas: " + ", ".join(entidades_formatadas)

    except Exception as e:
        print(f"Erro na ferramenta NER: {e}")
        return "Erro ao analisar o texto."

# Agora, "empacotamos" nossa função como uma Ferramenta (Tool) do LangChain
ferramenta_ner = Tool(
    name="analisador_de_sintomas",
    func=analisar_sintomas,
    description="Use esta ferramenta para analisar a última fala do paciente e extrair termos médicos importantes, como sintomas (PROBLEM), medicamentos (TREATMENT) ou exames (TEST). Use o resultado para guiar a conversa."
)

# Lista de ferramentas para o Agente
ferramentas = [ferramenta_ner]
print("Ferramenta NER 'analisador_de_sintomas' pronta.")

# --- BLOCO 2: CARREGAR O "CÉREBRO" (LLM MISTRAL) ---

print("Carregando Ferramenta 2: Modelo LLM (Cérebro)...")
print("AVISO: Isso baixará o Mistral-7B (pode levar 15GB+) e usará muita RAM (5-7GB).")

# ID do modelo que vamos usar (um dos melhores modelos abertos)
model_id = "mistralai/Mistral-7B-Instruct-v0.2"

# Configuração de Quantização (BitsAndBytes)
# Isso permite rodar um modelo gigante em hardware de consumidor (ex: 4-bit)
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.bfloat16
)

# Carrega o Tokenizador
tokenizer = AutoTokenizer.from_pretrained(model_id)

# Carrega o Modelo com a configuração de 4-bit
model = AutoModelForCausalLM.from_pretrained(
    model_id,
    quantization_config=bnb_config,
    device_map="auto" # Deixa a biblioteca 'accelerate' decidir onde colocar (CPU/GPU)
)

# Cria o pipeline de 'text-generation' do transformers
text_generation_pipeline = pipeline(
    "text-generation",
    model=model,
    tokenizer=tokenizer,
    max_new_tokens=512, # Limita o tamanho da resposta
    pad_token_id=tokenizer.eos_token_id,
    temperature=0.7 # Um pouco de criatividade, mas não muito
)

# "Empacota" o pipeline do transformers para ser usado pelo LangChain
llm = HuggingFacePipeline(pipeline=text_generation_pipeline)

print("Cérebro (LLM Mistral-7B) carregado com sucesso.")

# --- BLOCO 3: DEFINIR O "PROTOCOLO" (PROMPT DO AGENTE) ---

# Este é o "prompt de sistema" ou as regras do nosso Agente.
# É a parte mais importante para definir o comportamento de anamnese.
template_prompt = """
Você é um assistente médico de anamnese. Seu nome é 'Dr. Gemini'.
Seu objetivo é conduzir uma conversa fluida e empática com um paciente para extrair o máximo de informação sobre seus sintomas, seguindo um protocolo clínico.

FLUXO DA ANAMNESE:
1.  **Saudação:** Se apresente como 'Dr. Gemini' e pergunte o sintoma principal.
2.  **Sintoma Principal:** Entenda o sintoma. Use a ferramenta 'analisador_de_sintomas' para confirmar o que você entendeu.
3.  **Investigação (OPQRST):** Explore o sintoma principal.
    * **O** (Onset): Quando começou? Foi súbito ou gradual?
    * **P** (Palliation/Provocation): O que melhora? O que piora?
    * **Q** (Quality): Como é a dor/sintoma? (Ex: pontada, queimação, latejante).
    * **R** (Radiation): A dor irradia para outro lugar?
    * **S** (Severity): De 0 a 10, qual a intensidade?
    * **T** (Timing): É constante ou intermitente? Ocorre em algum horário específico?
4.  **Sintomas Associados:** Pergunte sobre outros sintomas (ex: febre, náusea, tontura).
5.  **Histórico:** Pergunte sobre medicamentos em uso, alergias ou condições pré-existentes.
6.  **Encerramento:** Ao final, faça um resumo breve do que foi coletado e informe que a anamnese será encaminhada a um profissional.

REGRAS OBRIGATÓRIAS (V1.0):
-   **NÃO DÊ DIAGNÓSTICOS.** Jamais diga ao paciente o que ele pode ter.
-   **NÃO DÊ CONSELHOS MÉDICOS.** Não sugira tratamentos, remédios ou dosagens.
-   **LIMITAÇÃO (V1.0):** Se o paciente perguntar o que é uma doença ou um remédio (ex: "o que é Paracetamol?"), responda educadamente que sua função (v1.0) é apenas coletar informações e que ele deve tirar essa dúvida com um médico.
-   **FOCO:** Mantenha o foco na coleta de dados. Seja gentil, mas direto ao ponto.
-   **FERRAMENTA:** Use a ferramenta 'analisador_de_sintomas' sempre que o paciente descrever um sintoma, para ajudar a estruturar seus pensamentos.

Histórico da Conversa:
{chat_history}

Paciente: {input}

Seu Raciocínio (Thought process):
{agent_scratchpad}
"""

# Cria o objeto PromptTemplate
prompt = PromptTemplate.from_template(template_prompt)

print("Protocolo (Prompt) do Agente definido.")

# --- BLOCO 4: CRIAR O AGENTE E O EXECUTOR ---

# Criamos o Agente ReAct (Reasoning and Acting)
agent = create_react_agent(llm, ferramentas, prompt)

# Definimos a memória (para o chatbot lembrar do histórico)
# k=4 significa que ele vai lembrar das últimas 4 trocas (P/M)
memory = ConversationBufferWindowMemory(
    k=4,
    memory_key="chat_history", # Chave deve ser a mesma do prompt
    input_key="input",
    output_key="output"
)

# Criamos o Executor do Agente, que junta o Agente, as Ferramentas e a Memória
agent_executor = AgentExecutor(
    agent=agent,
    tools=ferramentas,
    memory=memory,
    verbose=True, # ESSENCIAL: Mostra o "raciocínio" do LLM no terminal
    handle_parsing_errors=True # Lida com erros de formatação do LLM
)

print("Agente de Anamnese v1.0 está pronto.")

# --- BLOCO 5: LOOP DO CHAT ---

print("\n--- Início da Anamnese (v1.0) ---")
print("Digite 'sair' para terminar a conversa.")

while True:
    # Pega a entrada do usuário
    user_message = input("\nPaciente: ")
    if user_message.lower() == 'sair':
        break

    try:
        # Executa o agente
        response = agent_executor.invoke({"input": user_message})
        
        # Imprime a resposta
        print(f"\nDr. Gemini: {response['output']}")

    except Exception as e:
        print(f"Ocorreu um erro na execução do agente: {e}")
        print("Por favor, tente novamente.")

print("\n--- Fim da Anamnese ---")