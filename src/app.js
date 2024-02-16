import { createRetrievalChain } from "langchain/chains/retrieval";
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createHistoryAwareRetriever } from "langchain/chains/history_aware_retriever";
import { MessagesPlaceholder } from "@langchain/core/prompts";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import readline from 'readline';
import 'dotenv/config'


//End imports ******************************
let chatHistoryArray = [];

const embeddings = new OllamaEmbeddings({
    model: "llama2",
    maxConcurrency: 5,
});

const vectorstore = await FaissStore.load(
    process.env.VECTOR_STORE_LOCATION,
    embeddings
  );

const chatModel = new ChatOllama({
    baseUrl: "http://localhost:11434",
    model: "llama2",
});


//start in user input ******************************

const readInput = () => {
    const cons = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => {
        cons.question("\n  << What would you like to know: ", answer => {
            cons.close();
            resolve(answer);
        });
    });
};

const callback = async () => {
    const data = await readInput();
    console.log('\n>> ' + await prompts(data));
    await callback();
};

callback();

//end in user input ******************************

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
          "Given the above conversation, generate a natural language search input to look up in order to get information relevant to the conversation. Do not respond with anything except the input.",
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