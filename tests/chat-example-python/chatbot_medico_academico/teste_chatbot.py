import torch
from transformers import pipeline, AutoTokenizer
from langchain.llms import HuggingFacePipeline
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain

# --- 1. CONFIGURAÇÃO DO NER (Reutilizando seu código) ---

print("Carregando o pipeline NER...")
# Modelo BERT pré-treinado em português para NER clínico
modelo_ner = "HUMADEX/portugese_medical_ner" 
ner_pipeline = pipeline(
    "ner",
    model=modelo_ner,
    # Estratégia para agrupar sub-palavras reconhecidas como a mesma entidade
    aggregation_strategy="simple" 
)
print("Pipeline NER carregado.")

# --- 2. CONFIGURAÇÃO DO LLM (Usando um modelo de Geração Causal - BioMistral 7B) ---

# Modelo especializado em contexto biomédico
llm_id = "BioMistral/BioMistral-7B" 
llm_tokenizer = AutoTokenizer.from_pretrained(llm_id)

print(f"Carregando pipeline LLM (Modelo: {llm_id})...")

try:
    # CORREÇÃO CRÍTICA: O BioMistral (Mistral 7B) é um modelo de Geração Causal.
    # Deve usar 'text-generation' (em vez de 'text2text-generation', que é para T5).
    llm_pipeline = pipeline(
        "text-generation", 
        model=llm_id,
        tokenizer=llm_tokenizer,
        # Limite máximo de tokens para a resposta do LLM
        max_new_tokens=150,           
        # Tenta usar MPS (Apple Silicon) ou fallback para CPU
        device=0 if torch.backends.mps.is_available() else -1, 
        # Parâmetros de geração (amostragem para respostas mais criativas/variadas)
        do_sample=True,
        temperature=0.7,
    )
    
    # Wrap do pipeline Hugging Face para uso no LangChain
    llm = HuggingFacePipeline(pipeline=llm_pipeline)
    print(f"LLM '{llm_id}' configurado.")
    
except Exception as e:
    # Bloco de tratamento de erro para problemas de carregamento/memória
    print(f"\nERRO FATAL: Falha ao carregar o LLM {llm_id}. Tente um modelo menor (ex: 'TinyLlama/TinyLlama-1.1B-Chat-v1.0').")
    print(f"Detalhes do erro: {e}")
    llm = None

# --- 3. DEFINIÇÃO DO PROMPT E DA CADEIA (CHAIN) ---

# Prompt Template onde o resultado do NER será injetado
prompt_template = """Você é um assistente médico prestativo. Sua tarefa é responder perguntas do paciente.

Instrução: As entidades encontradas no texto do paciente são: {entidades_ner}.
Com base nessas entidades e na PERGUNTA abaixo, forneça uma resposta breve.

PERGUNTA DO PACIENTE: {pergunta_paciente}

RESPOSTA (focada nas entidades extraídas):"""

PROMPT = PromptTemplate(
    template=prompt_template, 
    input_variables=["entidades_ner", "pergunta_paciente"]
)

# Conecta o Prompt ao LLM para formar a cadeia de processamento
llm_chain = LLMChain(prompt=PROMPT, llm=llm)
# 

# --- 4. FUNÇÃO PRINCIPAL DE ORQUESTRAÇÃO ---

def chatbot_ner_llm():
    """Lógica principal: NER extrai entidades, LLM gera resposta contextualizada."""
    print("\n--- INICIANDO CHATBOT NER + LLM ---")
    print("Digite 'sair' para encerrar.")
    
    while True:
        pergunta_paciente = input("\nPaciente diz: ")
        
        if pergunta_paciente.lower() == 'sair':
            break
        
        # Etapa 1: Executar o NER na pergunta
        resultados_ner = ner_pipeline(pergunta_paciente)
        
        # Formatar entidades para injeção no Prompt
        entidades_formatadas = [f"{ent['entity_group']}: {ent['word']}" for ent in resultados_ner]
        entidades_str = "; ".join(entidades_formatadas) or "Nenhuma entidade clínica relevante encontrada."
            
        print(f"\n[INFO NER]: Entidades extraídas: {entidades_str}")
        
        # Etapa 2: Executar o LLM com o Prompt contextualizado
        try:
            # Executa a cadeia NER -> Prompt -> LLM
            resposta_llm = llm_chain.run(
                entidades_ner=entidades_str,
                pergunta_paciente=pergunta_paciente
            )
            
            # Limpeza do output do LLM para remover repetição do prompt
            resposta_final = resposta_llm.strip().split("RESPOSTA (focada nas entidades extraídas):")[-1].strip()

            print(f"\nAssistente (LLM): {resposta_final}")
            
        except Exception as e:
            # Captura erros durante a execução da cadeia (ex: problema de conexão com o modelo)
            print(f"Erro na execução da LLM Chain: {e}")

if __name__ == "__main__":
    if llm: # Verifica se o LLM foi carregado com sucesso antes de iniciar
        chatbot_ner_llm()
    else:
        print("\nO Chatbot não pode ser iniciado devido a um erro de configuração do LLM.")