import { NextRequest, NextResponse } from "next/server";
import { GokiteAASDK } from "gokite-aa-sdk";

const sdk = new GokiteAASDK(
  "kite_testnet",
  "https://rpc-testnet.gokite.ai",
  "https://bundler-service.staging.gokite.ai/rpc/"
);

function toHex(n: bigint | undefined): string {
  if (n === undefined || n === null) return "0x0";
  return "0x" + n.toString(16);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, eoaAddress } = body;

    if (!eoaAddress) {
      return NextResponse.json({ error: "Missing eoaAddress" }, { status: 400 });
    }

    switch (action) {
      case "getAddress": {
        const aaAddress = sdk.getAccountAddress(eoaAddress);
        return NextResponse.json({ aaAddress });
      }

      case "build": {
        const { target, callData, value } = body;
        if (!target || !callData) {
          return NextResponse.json({ error: "Missing target or callData" }, { status: 400 });
        }

        const request = {
          target,
          value: value ? BigInt(value) : BigInt(0),
          callData,
        };

        const userOp = await sdk.createUserOperation(eoaAddress, request);
        const hash = await sdk.getUserOpHash(userOp);

        // Convert all fields to hex strings for JSON-RPC bundler compatibility
        return NextResponse.json({
          userOp: {
            sender: userOp.sender,
            nonce: toHex(userOp.nonce),
            initCode: userOp.initCode,
            callData: userOp.callData,
            accountGasLimits: userOp.accountGasLimits,
            preVerificationGas: toHex(userOp.preVerificationGas),
            gasFees: userOp.gasFees,
            paymasterAndData: userOp.paymasterAndData,
            signature: userOp.signature || "0x",
          },
          hash,
        });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("AA API error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
