// Import necessary modules
import {ChatCompletionRequestMessage, Configuration, OpenAIApi} from "openai";
import {chatFunctionsMetadata, callChatFunction} from "./chat/functions"; // Chat functions module
import {ChatCompletionRequestMessageFunctionCall} from "openai/api"; // Function call type
import readline from "readline"; // Readline for interactive command line interface

import fs from 'fs/promises'; // Import the promise version of fs

import dotenv from 'dotenv-flow'; // Dotenv to manage environment variables
dotenv.config(); // Load environment variables

// Configure OpenAI API with the API key from environment variables
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Log a check if OpenAI is configured
console.log('OpenAI Configured?', !!process.env.OPENAI_API_KEY);

// Create a readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
});

// Asynchronous function to run a conversation with OpenAI
async function run_conversation() {
  let response;
  let message;
  let functionCall;
  let userQuestion;
  let systemPrompt;

  try {
    systemPrompt = `Here is a set of project requirements. """${await fs.readFile('reqs.md',
      'utf8')}""" Please convert these requirements into a markdown table.`;
  } catch (error) {
    console.log('No reqs.md found...');
    console.log("> Enter a system prompt:");
    systemPrompt = await getUserInput();

    // Exit the conversation if the user types "exit"
    if (systemPrompt.toLowerCase() === "exit") {
      return;
    }
  }
  // Prompt user for a system message


  // Initialize the conversation with the system message
  const conversation: ChatCompletionRequestMessage[] = [
    {
      role: "system",
      content: systemPrompt,
    },
  ];

  // Prompt the user for the first question
  console.log("> What is your first question? Or, blank to continue");
  userQuestion = await getUserInput();
  if(userQuestion) {
    conversation.push({
      role: "user",
      content: userQuestion,
    });
  }

  // Exit the conversation if the user types "exit"
  if (userQuestion.toLowerCase() === "exit") {
    return;
  }

  do {
    // Request a response from the OpenAI API
    response = await openai.createChatCompletion({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo-0613',
      messages: conversation,
      functions: chatFunctionsMetadata,
      function_call: 'auto',
      // If the last message has the function role, set temperature to 0, otherwise 0.7.
      // We want to ensure GTP doesn't get too creative with the function responses and
      // provide a more literal response
      temperature: conversation[conversation.length - 1]?.role === 'function' ? 0 : parseFloat(process.env.OPENAI_TEMPERATURE || '') || 0.7,
    });

    message = response.data.choices[0]?.message;

    // Add the assistant's response to the conversation
    conversation.push({
      role: "assistant",
      content: message?.content || '... no response ...',
    });

    functionCall = message?.function_call as ChatCompletionRequestMessageFunctionCall;

    if (functionCall?.name) {
      const functionCallResponse = await callChatFunction(functionCall?.name, functionCall?.arguments);

      // Add the function's response to the conversation
      if (['success', 'missing-required-parameters'].includes(functionCallResponse.status)) {
        // If successful, let the bot know, but also if required parameters are missing
        // so it can hopefully inquire about them
        conversation.push({
          role: "function",
          name: functionCall?.name,
          content: functionCallResponse.message,
        });
      } else {
        // On failure, simply state this and await feedback, don't have chat infer
        conversation.push({
          role: "assistant",
          content: functionCallResponse.message,
        });
      }
    } else {

      // Don't show the users questions back at them
      if (message?.role !== 'user') {
        console.log(`> ${message?.content}` || "... chat response failed...");
      }

      // Prompt the user for the next question
      userQuestion = await getUserInput();
      conversation.push({
        role: "user",
        content: userQuestion,
      });

      // Exit the conversation if the user types "exit"
      if (userQuestion.toLowerCase() === "exit") {
        break;
      }
    }
  } while (true);

  return response;
}

// Function to get user input from the command line
function getUserInput(): Promise<string> {
  return new Promise((resolve) => {
    rl.question("> ", (answer: string) => {
      resolve(answer);
    });
  });
}

// Start the conversation
run_conversation()
  .then((response) => {
    // Log the final response from OpenAI
    console.log(response?.data);
    // Close the readline interface
    rl.close();
  })
  .catch((error) => {
    // Log any errors that occurred
    console.error("Error:", error);
    // Close the readline interface
    rl.close();
  });
