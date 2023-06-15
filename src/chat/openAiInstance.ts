import {Configuration, OpenAIApi} from "openai";

// Configure the OpenAI API
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

export const openAiInstance = new OpenAIApi(configuration);
