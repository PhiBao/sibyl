import { NextRequest, NextResponse } from "next/server";

/**
 * Model Context Protocol (MCP) Server for Sibyl
 * Exposes agent reputation and service settlement as AI-callable tools
 * 
 * Protocol: https://modelcontextprotocol.io
 * Tools:
 *   - get_agent_status(address) -> score, tier, session
 *   - list_services() -> available agent services
 *   - get_service(serviceId) -> price, minScore, provider
 */

const PULSE_SCORE_ADDRESS = process.env.NEXT_PUBLIC_PULSE_SCORE_ADDRESS || "0x2824a4A5Dfa62E4F956358Fc2e2AE88175F6Af2b";

const TOOLS = [
  {
    name: "get_agent_status",
    description: "Get the on-chain reputation status of an agent wallet on Kite Chain",
    inputSchema: {
      type: "object" as const,
      properties: {
        address: { type: "string", description: "Ethereum address of the agent (0x...)" },
      },
      required: ["address"],
    },
  },
  {
    name: "list_services",
    description: "List all available agent services on the Sibyl Service Registry",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "get_service",
    description: "Get details of a specific service by ID",
    inputSchema: {
      type: "object" as const,
      properties: {
        serviceId: { type: "number", description: "Service ID number" },
      },
      required: ["serviceId"],
    },
  },
];

export async function GET() {
  return NextResponse.json({
    name: "Sibyl MCP",
    version: "1.0.0",
    protocolVersion: "2024-11-05",
    tools: TOOLS,
    contract: PULSE_SCORE_ADDRESS,
    chain: "kite-testnet",
    chainId: 2368,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, arguments: args } = body;

    switch (name) {
      case "get_agent_status": {
        const addr = args?.address;
        if (!addr || typeof addr !== "string") {
          return NextResponse.json({ error: "Missing or invalid 'address' parameter" }, { status: 400 });
        }
        // Return a template — the AI client should call the contract directly via RPC
        return NextResponse.json({
          address: addr,
          contract: PULSE_SCORE_ADDRESS,
          chainId: 2368,
          rpcUrl: "https://rpc-testnet.gokite.ai",
          method: "getAgent",
          abiFragment: {
            inputs: [{ name: "_agent", type: "address" }],
            outputs: [
              { name: "owner", type: "address" },
              { name: "score", type: "uint256" },
              { name: "totalTxns", type: "uint256" },
              { name: "successTxns", type: "uint256" },
              { name: "totalSpent", type: "uint256" },
              { name: "registeredAt", type: "uint256" },
              { name: "lastUpdated", type: "uint256" },
              { name: "exists", type: "bool" },
              { name: "sessionBudget", type: "uint256" },
              { name: "sessionSpent", type: "uint256" },
            ],
            stateMutability: "view",
          },
          note: "Call this via viem/ethers to get live data. Score is 0-1000. sessionBudget/sessionSpent are in USDC wei (18 decimals).",
        });
      }

      case "list_services": {
        return NextResponse.json({
          contract: PULSE_SCORE_ADDRESS,
          chainId: 2368,
          rpcUrl: "https://rpc-testnet.gokite.ai",
          countMethod: "getServiceCount",
          readMethod: "getService",
          abiFragment: {
            inputs: [{ name: "_serviceId", type: "uint256" }],
            outputs: [
              { name: "provider", type: "address" },
              { name: "name", type: "string" },
              { name: "description", type: "string" },
              { name: "endpoint", type: "string" },
              { name: "price", type: "uint256" },
              { name: "minScore", type: "uint256" },
            ],
            stateMutability: "view",
          },
          note: "Loop from 1 to getServiceCount() and call getService(i) for each.",
        });
      }

      case "get_service": {
        const id = args?.serviceId;
        if (!id || typeof id !== "number") {
          return NextResponse.json({ error: "Missing or invalid 'serviceId' parameter" }, { status: 400 });
        }
        return NextResponse.json({
          serviceId: id,
          contract: PULSE_SCORE_ADDRESS,
          chainId: 2368,
          rpcUrl: "https://rpc-testnet.gokite.ai",
          method: "getService",
          args: [id],
          abiFragment: {
            inputs: [{ name: "_serviceId", type: "uint256" }],
            outputs: [
              { name: "provider", type: "address" },
              { name: "name", type: "string" },
              { name: "description", type: "string" },
              { name: "endpoint", type: "string" },
              { name: "price", type: "uint256" },
              { name: "minScore", type: "uint256" },
            ],
            stateMutability: "view",
          },
          note: "Price is in USDC wei (18 decimals). Divide by 1e18 for human-readable.",
        });
      }

      default:
        return NextResponse.json({ error: `Unknown tool: ${name}` }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
