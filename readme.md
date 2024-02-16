## Setup
Download [Node.js](https://nodejs.org/en/download/).

Download Ollama (https://ollama.com/)
complete the set up.

copy the .env.example and change the 2 paths to your 2 local paths where you have your pdfs and where you you want the vectorstore to be saved.

``` bash
#pull ollama2
ollama pull llama2

# Install dependencies
npm install

# Run to build the vector store. depending on pdf file size and quantity, it can take some time
npm build-vectorstore

# Run to start communicating with the LLM
# you must wait until the process is finished with the build-vectorstore
npm start
```
