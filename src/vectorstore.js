import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import 'dotenv/config'

const directoryLoader = new DirectoryLoader(
    process.env.DIRECTORY_LOADER,
    {
      ".pdf": (path) => new PDFLoader(path),
    }
);

const docs = await directoryLoader.load();
console.log({ docs });

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
});
const splitDocs = await splitter.splitDocuments(docs);

console.log(splitDocs);


const embeddings = new OllamaEmbeddings({
    model: "llama2",
    maxConcurrency: 5,
});

console.log('please wait');
console.log('Docs are being saved into the Vector Store');

const vectorstore = await FaissStore.fromDocuments(
    splitDocs,
    embeddings
);

// Save the vector store to a directory
const directory = process.env.VECTOR_STORE_LOCATION;

await vectorstore.save(directory);

console.log('Docs are finished saving to '+ directory);

