# OpenAI GPT Functions NodeJS Technical Demo

Given the advent release of [GTP functions on June 13th 2023](https://openai.com/blog/function-calling-and-other-api-updates), this is a technical demo of how to use the OpenAI GPT-3.5-0613 API with NodeJS.

The official docs are light on NodeJS related implementations, only offering Python
[https://platform.openai.com/docs/guides/gpt/function-calling]](https://platform.openai.com/docs/guides/gpt/function-calling)

Converted the demo they sampled into NodeJS with some considerations on how to have an expansive list of possible functions you can call locally, and a continual chat in your terminal to test with.

## Features
* The demo function [get_current_weather.ts](src/chat/functions/get_current_weather.ts) has been touched up to expose its metadata and async resolver
* This with other possible functions are exposed via the [src/chat/functions.ts](src/chat/functions.ts) file, which the main [index.ts](src/index.ts) file imports consumes, automatically building a list of functions you can call via your GPT chatting
* Running the `start` node script will start a chat with GPT, first requesting a system prompt, then ask you for a question to start things off. 

## Setup

1. Clone this repo
2. Run `pnpm install` (or npm/yarn)
3. Copy the `.env` to `.env.local` and add your own [OpenAPI API key](https://platform.openai.com/account/api-keys) as `OPENAI_API_KEY`
4. Optionally, you can change the `OPENAI_MODEL` to a different model, but the demo is configured to use the freshly dropped `gpt-3.5-turbo-0613`

## Running

```shell
pnpm start # or npm start
```

### Example Run

```shell
> npx tsx src/index.ts

OpenAI Configured? true
> Enter a system prompt:
Help me find the weather
> What is your first question?
Whats the temp like duder?
> Sure, could you please provide me with the name of the city or location you're interested in?
Toronto
(debug) get_current_weather => {"location":"Toronto","temperature":"72","unit":"fahrenheit","forecast":["sunny","windy"]}
> The current temperature in Toronto is 72 degrees Fahrenheit. The weather forecast for today is sunny and windy.
We don't use fahrenheit up here...
(debug) get_current_weather => {"location":"Toronto","temperature":"72","unit":"celsius","forecast":["sunny","windy"]}
> My apologies for the oversight. The current temperature in Toronto is 72 degrees Celsius. The weather forecast for today is sunny and windy.
Good bot!
> Thank you! I'm here to help, so if you have any more questions, feel free to ask.
exit
{
  id: '...',
  object: 'chat.completion',
  created: 1686709052,
  model: 'gpt-3.5-turbo-0613',
  choices: [ { index: 0, message: [Object], finish_reason: 'stop' } ],
  usage: { prompt_tokens: 264, completion_tokens: 23, total_tokens: 287 }
}
```

## Considerations

* The demo is not a full chatbot, it's a demo of how to use the GPT-3.5 API with NodeJS and the one demo function
* It does show the promise of how we can now start to build and expose internal method as "plugins" to continue using GPT as the source of how/when it triggers actions we desire
* I believe this is a much more practical approach to using GPT agents/tooling and am excited to see what the community builds with this new functionality!
