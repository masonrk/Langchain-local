## Setup
Download [Node.js](https://nodejs.org/en/download/).

Download Ollama (https://ollama.com/)
complete the set up.

front end at http://localhost:4000

run the example pdf or add your own pdfs to the documents folder.

in the app.js file you can change the variable 'usePinecone' to false to use faiss and save a local docstore.json file. If you leave 'usePinecone' as true you will need to:

go to (https://app.pinecone.io/)
create an account.
create a new index and update the .env file to match your pinecone configuration.

``` bash
#pull ollama2
ollama pull llama2

#run mistral
ollama run mistral

# Install dependencies
npm install

# Run to build the vector store. depending on pdf file size and quantity, it can take some time
npm run build-vectorstore

# Run to start communicating with the LLM
# you must wait until the process is finished with the build-vectorstore
npm run start
```
