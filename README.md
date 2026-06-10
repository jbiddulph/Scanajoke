# Scanajoke

Scanajoke is a web app for turning real-world text into quick jokes and puns.
Users can scan or upload an image, OCR reads the text in the browser, and the
server sends that text to OpenAI to generate a friendly punchline.

## Features

- Camera capture or image upload for documents, receipts, signs, notes, and screenshots
- In-browser OCR powered by Tesseract.js
- Editable extracted text before generating a joke
- Server-side OpenAI integration so API keys are not exposed in the browser
- Responsive UI for phones, tablets, and desktop browsers

## Requirements

- Node.js 20 or newer
- An OpenAI API key

## Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Add your OpenAI key to `.env`:

```bash
OPENAI_API_KEY=sk-your-openai-api-key
```

## Development

Run the API server and Vite dev server together:

```bash
npm run dev
```

Open the Vite URL shown in the terminal. The frontend proxies `/api` requests to
the local Express server.

## Production build

Build the server and client:

```bash
npm run build
```

Start the Express server:

```bash
npm start
```

The server serves the built frontend from `dist` and exposes the joke endpoint at
`/api/joke`.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `OPENAI_API_KEY` | Yes | OpenAI API key used by the Express server |
| `OPENAI_MODEL` | No | Chat model for joke generation. Defaults to `gpt-4o-mini` |
| `PORT` | No | Express server port. Defaults to `8787` |
