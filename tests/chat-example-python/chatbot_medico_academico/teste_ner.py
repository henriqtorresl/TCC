from transformers import pipeline

print("Carregando o modelo NER Clínico Português (HUMADEX)...")
print("Isso pode demorar um pouco no primeiro download.\n")

# 1. DEFINIR O MODELO
# Este é um modelo "all-in-one" para NER clínico em português.
# Ele reconhece: PROBLEM, TEST, e TREATMENT.
# (Nota: o nome do modelo no HF está com 'portugese' escrito errado)
modelo_ner = "HUMADEX/portugese_medical_ner" 

# 2. CARREGAR O PIPELINE
ner_pipeline = pipeline(
    "ner",
    model=modelo_ner,
    # A estratégia "simple" agrupa sub-palavras (ex: "Para" + "cetamol")
    aggregation_strategy="simple" 
)

print("Modelo carregado com sucesso!\n")

# 3. DEFINIR UM TEXTO DE EXEMPLO
texto_paciente = ("Paciente relata dor de cabeça intensa há três dias. "
                  "Tomou Paracetamol mas a febre persiste.")

print(f"Analisando o texto: \"{texto_paciente}\"\n")

# 4. EXECUTAR A ANÁLISE
resultados_ner = ner_pipeline(texto_paciente)

# 5. MOSTRAR OS RESULTADOS
print("--- Entidades Encontradas ---")
if not resultados_ner:
    print("Nenhuma entidade clínica encontrada.")

for entidade in resultados_ner:
    print(f"Texto: {entidade['word']}")
    # As etiquetas serão PROBLEM, TEST, ou TREATMENT
    print(f"Tipo: {entidade['entity_group']}") 
    print(f"Score: {entidade['score']:.4f}\n")