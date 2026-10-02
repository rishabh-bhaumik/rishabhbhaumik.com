import { writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Dev-only: saves the logo lab's permanent presets to public/logo-presets.json
 * so they ship with the site. In production this route does nothing (404); the
 * file is served as a static asset and the presets are read-only.
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") return new Response("Not found", { status: 404 });
  const body = (await request.json()) as unknown;
  const valid =
    Array.isArray(body) &&
    body.every(
      (p) =>
        p &&
        typeof p === "object" &&
        typeof (p as Record<string, unknown>).id === "string" &&
        typeof (p as Record<string, unknown>).name === "string" &&
        typeof (p as Record<string, unknown>).look === "string"
    );
  if (!valid) return new Response("Expected [{ id, name, look }]", { status: 400 });
  const list = (body as { id: string; name: string; look: string }[]).map(({ id, name, look }) => ({ id, name, look }));
  await writeFile(path.join(process.cwd(), "public", "logo-presets.json"), JSON.stringify(list, null, 2) + "\n");
  return Response.json({ ok: true, count: list.length });
}
