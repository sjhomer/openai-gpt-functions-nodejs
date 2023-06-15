import {openAiInstance} from "../chat/openAiInstance";
import {ChatCompletionResponseMessage, CreateChatCompletionResponse} from "openai";

// @ts-ignore
export const exhaustFunctions = async (messages, hook) => {
  let response;
  let message: ChatCompletionResponseMessage | undefined;
  do {
    response = await openAiInstance.createChatCompletion({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo-0613',
      messages,
      function_call:'auto'
    });

    message = response.data.choices[0]?.message;
    hook(message);
  } while (message?.function_call);
}
