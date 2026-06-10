import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import express from "express";
import { generateJokeFromText, JokeGenerationError } from "./joke.js";

const app = express();
const port = Number(process.env.PORT ?? 8787);
const __dirname = dirname(fileURLToPath(import.meta.url));
const clientDistPath = join(__dirname, "..", "dist");

app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_request, response) => {
  response.json({ ok: true });
});

app.post("/api/joke", async (request, response, next) => {
  try {
    const rawText = typeof request.body?.text === "string" ? request.body.text : "";
    const joke = await generateJokeFromText(rawText);

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
    const statusCode = error instanceof JokeGenerationError ? error.statusCode : 500;
    const message =
      error instanceof Error ? error.message : "Something went wrong while talking to OpenAI.";

    response.status(statusCode).json({ error: message });
  }
);

app.listen(port, () => {
  console.log(`Scanajoke server listening on http://localhost:${port}`);
});
