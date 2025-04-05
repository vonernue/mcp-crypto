//import { DebugContracts } from "./_components/DebugContracts";
import type { NextPage } from "next";
import ChatInterface from "~~/app/chatbot/_components/ChatInterface";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "Chatbot interface",
  description: "Interface for user communication with LLM",
});

const Chatbot: NextPage = () => {
  return (
    <>
      <div className="text-center mt-8 bg-secondary p-10">
        <h1 className="text-4xl my-0">Chat Bot</h1>
        <p className="text-neutral">
          Blockchain Transactions with a simple message
          <br />
        </p>
        <ChatInterface />
      </div>
    </>
  );
};

export default Chatbot;
