from langchain.embeddings import HuggingFaceInstructEmbeddings
from langchain.vectorstores import FAISS
from langchain.llms import HuggingFaceHub
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationalRetrievalChain

def create_vectorstore(chunks):
    if not chunks:
        raise ValueError("Nenhum texto foi extraído dos arquivos. Verifique se os PDFs possuem conteúdo.")
    
    embeddings = HuggingFaceInstructEmbeddings(model_name="WhereIsAI/UAE-Large-V1")
    vectorstore = FAISS.from_texts(texts=chunks, embedding=embeddings)

    return vectorstore

def create_conversation_chain(vectorstore):
    # model_kwargs são parâmetros que vão ser passados para o modelo
    llm = HuggingFaceHub(
        repo_id='google/flan-t5-xxl',
        model_kwargs={"max_length": 512, "temperature": 0.1},
        task="text2text-generation"
    )

    memory = ConversationBufferMemory(memory_key='chat_history', return_messages=True)

    conversation_chain = ConversationalRetrievalChain.from_llm(
        llm=llm, 
        retriever=vectorstore.as_retriever(),
        memory=memory
    )

    return conversation_chain