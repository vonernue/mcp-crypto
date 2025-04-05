import { openai } from "@ai-sdk/openai";
import { ToolInvocation, streamText } from "ai";
import { isAddress, isHex } from "viem";
import { Web3 } from "web3";
import { z } from "zod";

interface Message {
  role: "user" | "assistant";
  content: string;
  toolInvocations?: ToolInvocation[];
}

export async function POST(req: Request) {
  const { messages }: { messages: Message[] } = await req.json();

  const result = streamText({
    model: openai("gpt-4o"),
    system: "You are a helpful assistant.",
    messages,
    tools: {
      getWeather: {
        description: "Send ETH to another address",
        parameters: z.object({
          receiver: z.string().describe("Receiver address"),
          amount: z.enum(["ETH"]).describe("The amount of ETH to send"),
        }),
        execute: async ({ receiver, amount }) => {
          const web3 = new Web3(window.ethereum);
          const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
          const currentAccount = accounts[0];
          if (!receiver || !(web3 && isAddress(receiver))) {
            return `Invalid receiver address`;
          }

          if (!amount || amount < 0) {
            return `Invalid amount of ETH`;
          }

          try {
            // Convert ETH to Wei
            const amountWei = web3.utils.toWei(amount, "ether");

            // Create transaction
            const tx = {
              from: currentAccount,
              to: receiver,
              value: amountWei,
              gas: 21000, // Standard gas limit for ETH transfers
            };
            // Send transaction
            const receipt = await web3.eth.sendTransaction(tx);
            console.log(`Transaction successful: ${receipt.transactionHash}`);
          } catch (err) {
            console.error("Error sending ETH:", err);
          }
        },
      },
    },
  });

  return result.toDataStreamResponse();
}
