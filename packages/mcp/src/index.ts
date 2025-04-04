import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { useEnsAddress } from 'wagmi'
import { normalize } from 'viem/ens'
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const USER_AGENT = "mcp-crypto/1.0";

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
    const { data: ensAddr } = useEnsAddress({
      name: normalize(ensDomain)
    });

    return {
      content: [
        {
          type: "text",
          text: ensAddr || "Address not found",
        },
      ],
    };
  }
)

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Weather MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});

