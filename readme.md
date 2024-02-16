## Setup
Download [Node.js](https://nodejs.org/en/download/).

Download Ollama (https://ollama.com/)
complete the set up.
open a terminal and run (ollama pull llama2)

go into your project and run

# Install dependencies
npm install

# Run to build the vector store. depending on pdf file size and quantity, it can take some time
npm build-vectorstore

# Run to start communicating with the LLM
# you must wait until the process is finished with the build-vectorstore
npm start
