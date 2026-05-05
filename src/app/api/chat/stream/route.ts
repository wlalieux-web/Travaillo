import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  const { sessionId, message } = await req.json() as { sessionId: string; message: string };

  if (!sessionId || !message) {
    return new Response(JSON.stringify({ error: "sessionId et message requis" }), { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      try {
        // Ouvrir le flux SSE avant d'envoyer le message (stream-first)
        const eventStream = await client.beta.sessions.events.stream(sessionId);

        // Envoyer le message en parallèle
        client.beta.sessions.events.send(sessionId, {
          events: [{
            type: "user.message",
            content: [{ type: "text", text: message }],
          }],
        }).catch(() => {/* handled by stream errors */});

        // Consommer les events
        for await (const event of eventStream) {
          if (event.type === "agent.message") {
            for (const block of event.content) {
              if (block.type === "text" && block.text) {
                send({ type: "text", text: block.text });
              }
            }
          } else if (event.type === "session.status_idle") {
            // stop_reason autres que requires_action = terminal
            const stopType = (event as any).stop_reason?.type;
            if (!stopType || stopType !== "requires_action") {
              send({ type: "done" });
              break;
            }
          } else if (event.type === "session.status_terminated") {
            send({ type: "done" });
            break;
          } else if (event.type === "session.error") {
            send({ type: "error", error: "Erreur de l'agent" });
            break;
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erreur inconnue";
        send({ type: "error", error: msg });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
