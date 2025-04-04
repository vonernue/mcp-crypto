import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as dotenv from "dotenv";
import { ENV } from './env.js';
import { ethers } from 'ethers';
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from "axios";

dotenv.config();

async function getEnsAddress(ensDomain: string) {
  const provider = new ethers.JsonRpcProvider("https://eth-mainnet.g.alchemy.com/v2/" + ENV.ALCHEMY_APIKEY);
  const address = await provider.resolveName(ensDomain);
  return address;
}

async function getPortfolioData(addresses: string[], chainid: number) {
  const url = "https://api.1inch.dev/portfolio/portfolio/v4/overview/protocols/current_value";

  const config = {
    headers: {
      "Authorization": "Bearer " + ENV.ONEINCH_APIKEY
    },
    params: {
      "addresses": addresses,
      "chain_id": chainid.toString(),
    },
    paramsSerializer: {
      indexes: null
    }
  };

  try {
    const response = await axios.get(url, config);
    return response.data;
  } catch (error) {
    return error;
  }
}

// Create server instance
const server = new McpServer({
  name: "MCP-Crypto",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

server.tool(
  "resolveEnsDomain",
  "Resolve ENS domain",
  {
    ensDomain: z.string().describe("ENS domain to resolve"),
  },
  async ({ ensDomain }) => {
    const address = await getEnsAddress(ensDomain);

    return {
      content: [
        {
          type: "text",
          text: address || "Address not found",
        },
      ],
    };
  }
)

server.tool(
  "getPortfolioData",
  "Get portfolio data of a list of wallet addresses",
  {
    addresses: z.array(z.string()).describe("Array of wallet addresses"),
    chainid: z.number().describe("Chain ID"),
  },
  async ({ addresses, chainid }) => {
    const portfolioData = await getPortfolioData(addresses, chainid);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(portfolioData) || "Cannot fetch portfolio data",
        },
      ],
    };
  }
)

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log("Crypto MCP Server running on stdio");
  // console.log(await getPortfolioData(["0xda84f65c486cfd4f923331f3763a0d51e4a615aa"], 1));
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});

