import OpenAI from "openai";

export class JokeGenerationError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "JokeGenerationError";
    this.statusCode = statusCode;
  }
}

export async function generateJokeFromText(rawText: string) {
  const text = rawText.trim();

  if (!text) {
    throw new JokeGenerationError("Text is required before making a joke.", 400);
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new JokeGenerationError(
      "OPENAI_API_KEY is not configured. Add it to the server environment and try again.",
      500
    );
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const promptText = text.length > 8000 ? text.slice(0, 8000) : text;

  const completion = await openai.chat.completions.create({
    model,
    temperature: 0.9,
    max_completion_tokens: 140,
    messages: [
      {
        role: "system",
        content:
          "You are Scanajoke, a playful assistant that writes short jokes and puns based only on scanned text. Keep it friendly, clever, and under three sentences. Do not mention OCR or scanning unless it is part of the joke."
      },
      {
        role: "user",
        content: `Make one joke or pun inspired by this scanned text:\n\n${promptText}`
      }
    ]
  });

  const content = completion.choices[0]?.message?.content;
  const joke = typeof content === "string" ? content.trim() : "";

  if (!joke) {
    throw new JokeGenerationError("OpenAI returned an empty joke.", 502);
  }

  return joke;
}
