import { ChatOpenAI } from "@langchain/openai";
import wxflows from "@wxflows/sdk/langchain";
import { ToolNode } from "@langchain/langgraph/prebuilt";

// Customers at :  https://introspection.apis.stepzen.com/customers
// Comment at : https://dummyjson.com/comments

//connect the wx workflow
const toolClient = new wxflows({
  endpoint: process.env.WXFLOW_ENDPOINT || "",
  apikey: process.env.WXFLOW_APIKEY,
});

// Retrieve the tools
const tools = await toolClient.lcTools;
const toolNode = new ToolNode(tools);

const initializeModel = () => {
  const chatModel = new ChatOpenAI({
    model: "gpt-4o",
    apiKey: process.env.OPENAI_API_KEY,
    temperature: 0.7, // higher temperature for more creative responses.
    maxTokens: 4096, // higher tokens for long responses
    streaming: true, // streaming true for SSE
    callbacks: [
      {
        handleLLMStart: async () => {
          console.log("LLM is Starting");
        },
        handleLLMEnd: async (output) => {
          console.log("End LLM Call", output);
          const usage = output.llmOutput?.usage;
          if (usage) {
          }
        },
      },
    ],
  }).bindTools(tools);

  return chatModel;
};
