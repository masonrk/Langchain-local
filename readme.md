## Setup
Download [Node.js](https://nodejs.org/en/download/).

Download Ollama (https://ollama.com/)
complete the set up.

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
