/**
 * Script de setup — à exécuter UNE SEULE FOIS pour créer l'agent et l'environment.
 *
 * Usage :
 *   export ANTHROPIC_API_KEY="sk-ant-..."   # ou apikey_...
 *   node scripts/setup-agent.mjs
 *
 * Copie ensuite les IDs affichés dans .env.local :
 *   MANAGED_AGENT_ID=agent_...
 *   MANAGED_AGENT_ENV_ID=env_...
 */

import Anthropic from "@anthropic-ai/sdk";
import { writeFileSync, readFileSync } from "fs";

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error("❌ ANTHROPIC_API_KEY manquante.");
  process.exit(1);
}

const client = new Anthropic({ apiKey });

async function main() {
  console.log("🌲 Création de l'agent Support pour Logistique Boréal...\n");

  // 1. Environment
  console.log("1/2  Création de l'environment...");
  const env = await client.beta.environments.create({
    name: "logistique-boreal-env",
    config: { type: "cloud", networking: { type: "unrestricted" } },
  });
  console.log(`     ✓ ENV ID : ${env.id}`);

  // 2. Agent
  console.log("2/2  Création de l'agent...");
  const agent = await client.beta.agents.create({
    name: "Support Agent",
    model: "claude-sonnet-4-6",
    system: `You are the Support Agent for Logistique Boréal, a field service management CRM for home service businesses in Quebec (plumbing, HVAC, landscaping, cleaning, etc.).

You help users navigate the platform and answer questions about:
- Clients : creating/editing client profiles, properties, notes
- Quotes (Devis) : creating quotes, taxes (TPS/TVQ for QC), optional items, sending to clients
- Jobs : planning one-off or recurring jobs, assigning technicians, visit management
- Calendar : viewing and managing visits
- Time tracking (Pointage) : clock in/out, breaks, timesheets
- Settings : company logo, profile info

Always respond in the same language the user uses (French or English).
Be concise, friendly, and practical — give actionable answers with steps when possible.
If you don't know something specific to the business, say so honestly.`,
    tools: [{ type: "agent_toolset_20260401" }],
  });
  console.log(`     ✓ AGENT ID : ${agent.id}  (version ${agent.version})`);

  // Patch .env.local
  const envPath = ".env.local";
  let envContent = readFileSync(envPath, "utf8");
  envContent = envContent
    .replace(/^MANAGED_AGENT_ID=.*$/m, `MANAGED_AGENT_ID=${agent.id}`)
    .replace(/^MANAGED_AGENT_ENV_ID=.*$/m, `MANAGED_AGENT_ENV_ID=${env.id}`);
  writeFileSync(envPath, envContent);

  console.log("\n✅  .env.local mis à jour automatiquement.");
  console.log("\n📋  Résumé :");
  console.log(`   MANAGED_AGENT_ID=${agent.id}`);
  console.log(`   MANAGED_AGENT_ENV_ID=${env.id}`);
  console.log("\n🚀  Redémarrez le serveur : npm run dev");
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
