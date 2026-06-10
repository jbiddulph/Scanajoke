import type { IncomingMessage, ServerResponse } from "node:http";
import { generateJokeFromText, JokeGenerationError } from "../server/joke.js";

type JsonRequest = IncomingMessage & {
  body?: unknown;
  method?: string;
};

type JsonResponse = ServerResponse & {
  status: (statusCode: number) => JsonResponse;
  json: (body: unknown) => void;
};

function getTextFromBody(body: unknown) {
  if (typeof body === "string") {
    try {
      const parsedBody = JSON.parse(body) as unknown;

      return getTextFromBody(parsedBody);
    } catch {
      return "";
    }
  }

  if (body && typeof body === "object" && "text" in body) {
    const text = (body as { text?: unknown }).text;

    return typeof text === "string" ? text : "";
  }

  return "";
}

export default async function handler(request: JsonRequest, response: JsonResponse) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed. Use POST." });
    return;
  }

  try {
    const joke = await generateJokeFromText(getTextFromBody(request.body));

    response.status(200).json({ joke });
  } catch (error) {
    const statusCode = error instanceof JokeGenerationError ? error.statusCode : 500;
    const message =
      error instanceof Error ? error.message : "Something went wrong while talking to OpenAI.";

    response.status(statusCode).json({ error: message });
  }
}
