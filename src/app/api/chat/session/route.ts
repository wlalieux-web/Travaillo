import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST() {
  const agentId = process.env.MANAGED_AGENT_ID;
  const envId = process.env.MANAGED_AGENT_ENV_ID;

  if (!agentId || !envId) {
    return NextResponse.json(
      { error: "Agent non configuré. Exécutez node scripts/setup-agent.mjs" },
      { status: 503 }
    );
  }

  try {
    const session = await client.beta.sessions.create({
      agent: agentId,
      environment_id: envId,
      title: `Chat session ${new Date().toISOString()}`,
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur inconnue";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
