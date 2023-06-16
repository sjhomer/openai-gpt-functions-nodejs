import {openAiInstance} from "../openAiInstance";

const metadata: ChatFunctionMetadata = {
  name: "convert_requirements_to_md",
  description: "Convert a large text of project requirements into a markdown table",
  parameters: {
    type: "object",
    properties: {
      requirements_text: {
        type: "string",
        description: "The large context of project requirements",
      },
    },
    required: ["requirements_text"],
  },
};

async function resolver(args: any) {
  // Make the OpenAI API call
  const response = await openAiInstance.createChatCompletion({
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo-0613',
    messages: [{
      role: "system",
      content: `You will be provided a set of project requirements. It is your job to convert the requirements into a markdown table with following considerations in mind: * Categories of work efforts * High level tasks, and their purpose.`,
    }, {
      role: "user",
      content: args.requirements_text
    }],
    temperature: 0,
  });

  // Return the model's response
  return response.data.choices[0]?.message || '.... error ...';
}

export {metadata, resolver};
