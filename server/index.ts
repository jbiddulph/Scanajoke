import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import express from "express";
import OpenAI from "openai";

const app = express();
const port = Number(process.env.PORT ?? 8787);
const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const __dirname = dirname(fileURLToPath(import.meta.url));
const clientDistPath = join(__dirname, "..", "dist");

app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_request, response) => {
  response.json({ ok: true });
});

app.post("/api/joke", async (request, response, next) => {
  try {
    const rawText = typeof request.body?.text === "string" ? request.body.text : "";
    const text = rawText.trim();

    if (!text) {
      response.status(400).json({ error: "Text is required before making a joke." });
      return;
    }

    if (!process.env.OPENAI_API_KEY) {
      response.status(500).json({
        error:
          "OPENAI_API_KEY is not configured. Add it to the server environment and try again."
      });
      return;
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
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
      response.status(502).json({ error: "OpenAI returned an empty joke." });
      return;
    }

    response.json({ joke });
  } catch (error) {
    next(error);
  }
});

if (existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
}

app.use(
  (
    error: unknown,
    _request: express.Request,
    response: express.Response,
    _next: express.NextFunction
  ) => {
    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong while talking to OpenAI.";

    response.status(500).json({ error: message });
  }
);

app.listen(port, () => {
  console.log(`Scanajoke server listening on http://localhost:${port}`);
});
