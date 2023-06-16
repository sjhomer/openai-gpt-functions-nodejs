declare namespace NodeJS {
  interface ProcessEnv {
    OPENAI_API_KEY: string;
    OPENAI_MODEL: string;
    OPENAI_TEMPERATURE: string;
  }
}
