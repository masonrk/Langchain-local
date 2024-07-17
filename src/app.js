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

const usePinecone = false;
//const pinecone = new Pinecone();
//const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX);

// End imports ******************************
let vectorstore; // Declare global variable for vectorstore
let chatModel; // Declare global variable for chatModel
let chatHistory = {}; // Object to store chat history for each session

const setup = async () => {
    const embeddings = new OllamaEmbeddings({
        model: "llama3",
        maxConcurrency: 5,
    });

    if (usePinecone) {
        console.log('Using Pinecone');
        vectorstore = await PineconeStore.fromExistingIndex(
            embeddings,
            { pineconeIndex }
        );
    } else {
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
    chatHistory[socket.id] = [];

    socket.on('chat message', async (msg) => {
        try {
            const receivedAnswer = await prompts(msg, socket.id);
            socket.emit('chat message', receivedAnswer);
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
        delete connectedClients[socket.id];
        delete chatHistory[socket.id];
    });
});

server.listen(4000, () => {
    console.log('listening on *:4000');
});

function prompts(input, sessionId) {
    const prompt = ChatPromptTemplate.fromTemplate(`
        You are a large language model. You possess comprehensive knowledge across various domains including but not limited to science, technology, history, arts, and current events up until 2023. You are capable of understanding and generating human-like text based on the input provided to you.

        You can assist with answering questions, providing explanations, creating content, offering recommendations, and engaging in meaningful conversations. Use your extensive knowledge and understanding to provide the best possible answer.

        Answer the following question based on the provided context if it exists. If the context does not contain enough information to answer the question fully, answer to the best of your abilities based on your general knowledge.

        <context>
        {context}
        </context>

        Question: ${input}

        Response:`
    );
    return myfunc(prompt, input, sessionId);
}


async function myfunc(prompt, input, sessionId) {
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
        chat_history: chatHistory[sessionId],
        input,
    });

    chatHistory[sessionId].push(new HumanMessage(input), new AIMessage(result.answer));
    return result.answer;
}
