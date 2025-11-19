import streamlit as st
from utils import chatbot, files
from streamlit_chat import message
from dotenv import load_dotenv
load_dotenv()

def main():

    st.set_page_config(page_title='Chat - Anamnese', page_icon=':books:')

    st.header('Converse com seus arquivos')
    user_question = st.text_input('Faça uma pergunta para mim!')

    if ('conversation' not in st.session_state):

        st.session_state.conversation = None

    if (user_question):

        response = st.session_state.conversation(user_question)['chat-history'][-1] # Pegando a última mensagem do memory do langchain, a key definida pra acessar o memory é o 'chat_history'

        for i, text in enumerate(response):

            # as mensagens pares são do user, dito que ele sempre começa a conversa
            if (i % 2 == 0):
                message(text.content, is_user=True, key=(i) + '_user')
            else:
                message(text.content, is_user=False, key=(i) + '_bot')


    with st.sidebar:

        st.subheader('Seus arquivos')
        pdf_docs = st.file_uploader('Carregue os seus arquivos em formato PDF', accept_multiple_files=True)

        if st.button('Processar'):
            all_files_text = files.process_files(pdf_docs)

            chunks = files.create_text_chunks(all_files_text)

            vectorstore = chatbot.create_vectorstore(chunks)

            st.session_state.conversation = chatbot.create_conversation_chain(vectorstore)



if __name__ == '__main__':

    main()