const { createRetrievalChain } = require("langchain/chains/retrieval");
const { ChatOllama } = require("@langchain/community/chat_models/ollama");
const { createStuffDocumentsChain } = require("langchain/chains/combine_documents");
const { OllamaEmbeddings } = require("@langchain/community/embeddings/ollama");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { createHistoryAwareRetriever } = require("langchain/chains/history_aware_retriever");
const { MessagesPlaceholder } = require("@langchain/core/prompts");
const { HumanMessage, AIMessage } = require("@langchain/core/messages");
const { FaissStore } = require("@langchain/community/vectorstores/faiss");
const { Pinecone } = require("@pinecone-database/pinecone");
const { PineconeStore } = require("@langchain/pinecone");
require('dotenv').config()

const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const usePinecone = true;
const pinecone = new Pinecone();
const pineconeIndex = pinecone.Index('vector-store');


//End imports ******************************
let vectorstore; // Declare global variable for vectorstore
let chatModel; // Declare global variable for chatModel
let chatHistoryArray = [];

const setup = async () => {

    const embeddings = new OllamaEmbeddings({
        model: "mistral",
        maxConcurrency: 5,
    });

    if(usePinecone){
        console.log('in pinecone');
        vectorstore = await PineconeStore.fromExistingIndex(
            embeddings,
            { pineconeIndex }
        );
    }
    else{
        vectorstore = await FaissStore.load(
            './vector_storage/',
            embeddings
        );
    }
    chatModel = new ChatOllama({
        baseUrl: "http://localhost:11434",
        model: "llama2",
    });
}
setup();



app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

const connectedClients = {};

io.on('connection', (socket) => {
    console.log('a user connected');
    
    connectedClients[socket.id] = socket;

    socket.on('chat message', async (msg) => {
        try {
            const recievedAnswer = await prompts(msg);
            socket.emit('chat message', recievedAnswer);
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });
    
    socket.on('disconnect', () => {
        console.log('user disconnected');
        delete connectedClients[socket.id];
    });
});

server.listen(4000, () => {
  console.log('listening on *:4000');
});

function prompts(input){
    const prompt =
    ChatPromptTemplate.fromTemplate(`Answer the following question based only on the provided context:

        <context>
        {context}
        </context>

        Question: ${input}`
    );
    return myfunc(prompt, input);
}

async function myfunc(prompt, input){
    const documentChain = await createStuffDocumentsChain({
        llm: chatModel,
        prompt,
    });
    const retriever = vectorstore.asRetriever();

    const historyAwarePrompt = ChatPromptTemplate.fromMessages([
        new MessagesPlaceholder("chat_history"),
        ["user", "{input}"],
        [
          "user",
          "Given the above conversation, generate a search query to look up in order to get information relevant to the conversation",
        ],
    ]);
    
    const historyAwareRetrieverChain = await createHistoryAwareRetriever({
        llm: chatModel,
        retriever,
        rephrasePrompt: historyAwarePrompt,
    });

    const retrievalChain = await createRetrievalChain({
    combineDocsChain: documentChain,
    retriever: historyAwareRetrieverChain,
    });

    const result = await retrievalChain.invoke({
        chat_history: chatHistoryArray,
        input,
    });

    chatHistoryArray.push(new HumanMessage(input),new AIMessage(result.answer));
    return result.answer;
}

