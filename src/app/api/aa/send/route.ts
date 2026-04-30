import { NextRequest, NextResponse } from "next/server";
import { serializeUserOperation } from "gokite-aa-sdk";

const BUNDLER_RPC = "https://bundler-service.staging.gokite.ai/rpc/";
const ENTRY_POINT = "0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userOp } = body;

    if (!userOp || !userOp.signature || userOp.signature === "0x") {
      return NextResponse.json({ error: "Missing signed userOp" }, { status: 400 });
    }

    // The SDK's serializeUserOperation unpacks packed fields for bundler compatibility:
    //   accountGasLimits → callGasLimit + verificationGasLimit
    //   gasFees → maxFeePerGas + maxPriorityFeePerGas
    const serialized = serializeUserOperation(userOp);

    console.log("[AA Send] Serialized UserOp:", JSON.stringify(serialized, null, 2));

    // Send to bundler via JSON-RPC
    const res = await fetch(BUNDLER_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_sendUserOperation",
        params: [serialized, ENTRY_POINT],
        id: Date.now(),
      }),
    });

    const data = await res.json();
    console.log("[AA Send] Bundler response:", JSON.stringify(data, null, 2));

    if (data.error) {
      return NextResponse.json(
        { error: data.error.message || "Bundler rejected UserOp" },
        { status: 400 }
      );
    }

    const userOpHash = data.result;

    // Poll for status
    const status = await pollUserOpStatus(userOpHash);

    return NextResponse.json({ userOpHash, status });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[AA Send] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

async function pollUserOpStatus(userOpHash: string, maxAttempts = 15): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    try {
      const res = await fetch(BUNDLER_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_getUserOperationReceipt",
          params: [userOpHash],
          id: Date.now(),
        }),
      });
      const data = await res.json();
      if (data.result) {
        if (data.result.success) {
          return "success";
        }
        // Extract revert reason if available
        const reason = data.result.reason || data.result.revertReason || "";
        return reason ? `reverted: ${reason}` : "reverted";
      }
    } catch {
      // Retry
    }
  }
  return "pending";
}
