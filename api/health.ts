import type { IncomingMessage, ServerResponse } from "node:http";

type JsonResponse = ServerResponse & {
  status: (statusCode: number) => JsonResponse;
  json: (body: unknown) => void;
};

export default function handler(_request: IncomingMessage, response: JsonResponse) {
  response.status(200).json({ ok: true });
}
