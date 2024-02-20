const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { OllamaEmbeddings } = require("@langchain/community/embeddings/ollama");
const { DirectoryLoader } = require("langchain/document_loaders/fs/directory");
const { PDFLoader } = require("langchain/document_loaders/fs/pdf");
const { Pinecone } = require("@pinecone-database/pinecone");
const { PineconeStore } = require("@langchain/pinecone");
require('dotenv').config()

async function processData() {

    const pinecone = new Pinecone();

    const pineconeIndex = pinecone.Index('vector-store');

    const directoryLoader = new DirectoryLoader(
        './src/documents/',
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

    console.log('Please wait');
    console.log('Docs are being saved into the Vector Store');

    await PineconeStore.fromDocuments(splitDocs, embeddings, {
        pineconeIndex,
        maxConcurrency: 5, // Maximum number of batch requests to allow at once. Each batch is 1000 vectors.
      });

    // Save the vector store to a directory
}

processData()
    .catch(error => {
        console.error('Error processing data:', error);
    });


