const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { OllamaEmbeddings } = require("@langchain/community/embeddings/ollama");
const { DirectoryLoader } = require("langchain/document_loaders/fs/directory");
const { PDFLoader } = require("langchain/document_loaders/fs/pdf");
const { FaissStore } = require("@langchain/community/vectorstores/faiss");

async function processData() {
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

    const vectorstore = await FaissStore.fromDocuments(
        splitDocs,
        embeddings
    );

    // Save the vector store to a directory
    const directory = './vector_storage/';

    await vectorstore.save(directory);

    console.log('Docs are finished saving to ' + directory);
}

processData()
    .catch(error => {
        console.error('Error processing data:', error);
    });


