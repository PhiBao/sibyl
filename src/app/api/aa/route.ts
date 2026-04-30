import { NextRequest, NextResponse } from "next/server";
import { GokiteAASDK } from "gokite-aa-sdk";
import {
  createUserOpForEstimation,
  packAccountGasLimits,
  encodeFunctionCall,
} from "gokite-aa-sdk";
import { ethers } from "ethers";

const sdk = new GokiteAASDK(
  "kite_testnet",
  "https://rpc-testnet.gokite.ai",
  "https://bundler-service.staging.gokite.ai/rpc/"
) as any;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const ENTRY_POINT = "0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108";

function toHex(n: bigint | undefined): string {
  if (n === undefined || n === null) return "0x0";
  return "0x" + n.toString(16);
}

function userOpToJson(userOp: any) {
  return {
    sender: userOp.sender,
    nonce: toHex(userOp.nonce),
    initCode: userOp.initCode,
    callData: userOp.callData,
    accountGasLimits: userOp.accountGasLimits,
    preVerificationGas: toHex(userOp.preVerificationGas),
    gasFees: userOp.gasFees,
    paymasterAndData: userOp.paymasterAndData,
    signature: userOp.signature || "0x",
  };
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

      case "build":
      case "prepare": {
        const { target, callData, value } = body;
        if (!target || !callData) {
          return NextResponse.json(
            { error: "Missing target or callData" },
            { status: 400 }
          );
        }

        const request = {
          target,
          value: value ? BigInt(value) : BigInt(0),
          callData,
        };

        // 1. Create base userOp with default token (for estimation)
        const baseUserOp = await sdk.createUserOperation(eoaAddress, request);

        // 2. Estimate gas via bundler (may fail if paymaster is underfunded)
        let gasEstimate: any;
        let estimationFailed = false;
        let estimationError = "";
        try {
          const userOpForEstimation = createUserOpForEstimation(baseUserOp);
          gasEstimate = await sdk.provider.estimateUserOperationGas(
            userOpForEstimation,
            ENTRY_POINT
          );
          gasEstimate.callGasLimit = gasEstimate.callGasLimit + 5000000n;
        } catch (estErr: any) {
          estimationFailed = true;
          estimationError = estErr.message || String(estErr);
          console.warn("[AA] Gas estimation failed:", estimationError);
          // Fallback to hardcoded gas values from createUserOperation
          gasEstimate = {
            callGasLimit: BigInt(300000),
            verificationGasLimit: BigInt(300000),
            preVerificationGas: BigInt(1000000),
            maxFeePerGas: BigInt(10000000),
            maxPriorityFeePerGas: BigInt(1),
          };
        }

        // 3. Update gas fields in base userOp
        baseUserOp.accountGasLimits = packAccountGasLimits(
          gasEstimate.verificationGasLimit,
          gasEstimate.callGasLimit
        );
        baseUserOp.preVerificationGas = gasEstimate.preVerificationGas;
        baseUserOp.gasFees = packAccountGasLimits(
          gasEstimate.maxPriorityFeePerGas,
          gasEstimate.maxFeePerGas
        );

        // 4. Check sponsorship eligibility (may also fail if paymaster is underfunded)
        let sponsorshipAvailable = false;
        try {
          const totalCostWei =
            gasEstimate.callGasLimit +
            gasEstimate.verificationGasLimit +
            gasEstimate.preVerificationGas;
          const paymasterInfo = await sdk.getPaymasterInfo(
            sdk.config.paymaster,
            baseUserOp.sender,
            totalCostWei
          );
          sponsorshipAvailable = paymasterInfo.sponsorshipAvailable;
        } catch (pmErr: any) {
          console.warn("[AA] Paymaster info failed:", pmErr.message || String(pmErr));
          sponsorshipAvailable = false;
        }

        let mode: "sponsored" | "token" = "sponsored";
        let finalUserOp = baseUserOp;

        if (sponsorshipAvailable) {
          // Sponsored mode: rebuild with ZERO_ADDRESS as token to signal sponsorship
          finalUserOp = await sdk.createUserOperation(
            eoaAddress,
            request,
            undefined,
            sdk.config.paymaster,
            ZERO_ADDRESS
          );
          finalUserOp.accountGasLimits = baseUserOp.accountGasLimits;
          finalUserOp.preVerificationGas = baseUserOp.preVerificationGas;
          finalUserOp.gasFees = baseUserOp.gasFees;
          mode = "sponsored";
        } else {
          // Token payment mode: pay gas with Test USD (USDC)
          const tokenAddress = sdk.config.supportedTokens[1].address;

          // Check AA wallet token balance vs estimated gas cost
          try {
            const tokenContract = new ethers.Contract(
              tokenAddress,
              ["function balanceOf(address) view returns (uint256)"],
              sdk.ethersProvider
            );
            const balance = await tokenContract.balanceOf(baseUserOp.sender);

            // Get paymaster exchange rate for this token
            const paymaster = new ethers.Contract(
              sdk.config.paymaster,
              ["function supportedTokens(address) view returns (uint256)"],
              sdk.ethersProvider
            );
            const exchangeRate = await paymaster.supportedTokens(tokenAddress);
            const totalCostWei =
              gasEstimate.callGasLimit +
              gasEstimate.verificationGasLimit +
              gasEstimate.preVerificationGas;
            const tokenCost = exchangeRate > 0n
              ? (totalCostWei * BigInt(1e18)) / exchangeRate
              : totalCostWei;

            if (balance < tokenCost) {
              const required = ethers.formatUnits(tokenCost, 18);
              const available = ethers.formatUnits(balance, 18);
              return NextResponse.json(
                {
                  error: `AA wallet ${baseUserOp.sender} has insufficient USDC for gas. Required: ~${required} USDC, Available: ~${available} USDC. Please fund the AA wallet or try again when sponsorship is available.`,
                  mode: "token",
                  aaAddress: baseUserOp.sender,
                },
                { status: 400 }
              );
            }
          } catch {
            // Ignore balance check errors, proceed optimistically
          }

          // Add approve(0) + approve(max) for paymaster to spend token
          const approve0CallData = encodeFunctionCall(
            ["function approve(address,uint256) returns (bool)"],
            "approve",
            [sdk.config.paymaster, "0"]
          );
          const approveMaxCallData = encodeFunctionCall(
            ["function approve(address,uint256) returns (bool)"],
            "approve",
            [sdk.config.paymaster, ethers.MaxUint256.toString()]
          );

          // Batch: approve(0), approve(max), then original call
          const batchRequest = {
            targets: [tokenAddress, tokenAddress, request.target],
            values: [BigInt(0), BigInt(0), request.value || BigInt(0)],
            callDatas: [approve0CallData, approveMaxCallData, request.callData],
          };

          finalUserOp = await sdk.createUserOperation(
            eoaAddress,
            batchRequest,
            undefined,
            sdk.config.paymaster,
            tokenAddress
          );
          finalUserOp.accountGasLimits = baseUserOp.accountGasLimits;
          finalUserOp.preVerificationGas = baseUserOp.preVerificationGas;
          finalUserOp.gasFees = baseUserOp.gasFees;
          mode = "token";
        }

        const hash = await sdk.getUserOpHash(finalUserOp);

        return NextResponse.json({
          userOp: userOpToJson(finalUserOp),
          hash,
          mode,
          estimationFailed,
          estimationError: estimationFailed ? estimationError : undefined,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("AA API error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
