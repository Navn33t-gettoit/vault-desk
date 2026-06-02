import { NextResponse } from "next/server";
import { saveConfiguredVaultPath } from "@/lib/vault-config.server";
import { scanVault } from "@/lib/vault-scan";

export const dynamic = "force-dynamic";

type ScanBody = {
  vaultPath?: string;
};

export async function POST(request: Request) {
  let body: ScanBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { vaultPath } = body;

  if (!vaultPath || typeof vaultPath !== "string") {
    return NextResponse.json({ error: "Missing vaultPath" }, { status: 400 });
  }

  try {
    const result = await scanVault(vaultPath);
    await saveConfiguredVaultPath(vaultPath);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scan failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
