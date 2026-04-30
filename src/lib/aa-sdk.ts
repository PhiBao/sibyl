// Browser-safe AA SDK wrapper — calls server-side API routes
// gokite-aa-sdk is NOT imported here (it crashes in browser due to dotenv/process.stdout)

export const AA_SETTLEMENT_CONTRACT = "0x8d9FaD78d5Ce247aA01C140798B9558fd64a63E3";
export const AA_VAULT_IMPL = "0xB5AAFCC6DD4DFc2B80fb8BCcf406E1a2Fd559e23";

import { ethers } from "ethers";
import { PULSE_SCORE_ABI, PULSE_SCORE_ADDRESS, USDC_ADDRESS } from "./web3";

export interface GaslessTxRequest {
  target: string;
  value?: bigint;
  callData: string;
}

export interface BuildUserOpResponse {
  userOp: Record<string, unknown>;
  hash: string;
  mode?: "sponsored" | "token";
  estimationFailed?: boolean;
  estimationError?: string;
}

export async function getAAWalletAddress(eoaAddress: string): Promise<string> {
  const res = await fetch("/api/aa", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "getAddress", eoaAddress }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to get AA address");
  return data.aaAddress;
}

export async function buildUserOp(
  eoaAddress: string,
  request: GaslessTxRequest
): Promise<BuildUserOpResponse> {
  const res = await fetch("/api/aa", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "build",
      eoaAddress,
      target: request.target,
      callData: request.callData,
      value: request.value?.toString(),
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to build UserOp");
  return data;
}

export async function sendSignedUserOp(userOp: Record<string, unknown>): Promise<{ userOpHash: string; status: string }> {
  const res = await fetch("/api/aa/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userOp }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to send UserOp");
  return data;
}

export function encodeRegisterAgent(address: string): string {
  const iface = new ethers.Interface(PULSE_SCORE_ABI as ethers.InterfaceAbi);
  return iface.encodeFunctionData("registerAgent", [address]);
}

export function encodeRequestService(serviceId: bigint, buyer: string): string {
  const iface = new ethers.Interface(PULSE_SCORE_ABI as ethers.InterfaceAbi);
  return iface.encodeFunctionData("requestService", [serviceId, buyer]);
}

export function encodeSettlePayment(serviceId: bigint, buyer: string, success: boolean): string {
  const iface = new ethers.Interface(PULSE_SCORE_ABI as ethers.InterfaceAbi);
  return iface.encodeFunctionData("settlePayment", [serviceId, buyer, success]);
}

export function encodeApproveUSDC(spender: string, amount: bigint): string {
  const iface = new ethers.Interface([
    "function approve(address spender, uint256 amount) returns (bool)",
  ]);
  return iface.encodeFunctionData("approve", [spender, amount]);
}

export function encodeRefreshSession(): string {
  const iface = new ethers.Interface(PULSE_SCORE_ABI as ethers.InterfaceAbi);
  return iface.encodeFunctionData("refreshSession", []);
}
