"use client";

import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import { Socket, io } from "socket.io-client";
import { useAccount } from "wagmi";

// Define types for the socket events
interface SignResultData {
  account: string;
  message: string;
  signature: string;
  timestamp: string;
  error?: string;
}

export const MetaMaskAutomation = () => {
  const { address: connectedAddress } = useAccount();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [socketStatusMessages, setSocketStatusMessages] = useState<string[]>([]);
  const [signStatusMessages, setSignStatusMessages] = useState<string[]>([]);

  // Function to add a new status message
  const addSocketStatus = useCallback((message: string) => {
    setSocketStatusMessages(prev => [...prev, message]);
  }, []);

  const addSignStatus = useCallback((message: string) => {
    setSignStatusMessages(prev => [...prev, message]);
  }, []);

  // Function to clear status messages
  const clearSignStatus = useCallback(() => {
    setSignStatusMessages([]);
  }, []);

  // Initialize Socket.IO connection
  useEffect(() => {
    // Connect to the WebSocket server - using original server on port 3000
    const serverUrl = "http://localhost:3000";
    const socketInstance = io(serverUrl);

    socketInstance.on("connect", () => {
      console.log("Connected to server with ID:", socketInstance.id);
      setIsSocketConnected(true);
      addSocketStatus(`Connected to WebSocket server (ID: ${socketInstance.id})`);
    });

    socketInstance.on("disconnect", () => {
      console.log("Disconnected from server");
      setIsSocketConnected(false);
      addSocketStatus("Disconnected from WebSocket server");
    });

    socketInstance.on("serverMessage", (data: { message: string }) => {
      console.log("Server message:", data);
      addSocketStatus(`Server: ${data.message}`);
    });

    socketInstance.on("signMessageResult", (data: { message: string }) => {
      console.log("checking emit: ", data);
      addSocketStatus(`emit Server: ${data.message}`);
    });

    // Listen for sign trigger from server
    socketInstance.on("triggerSign", async (data: { message: string }) => {
      console.log("Received sign trigger from server:", data);
      addSocketStatus(`Received sign trigger: ${data.message}`);

      // Handle the sign request
      if (connectedAddress) {
        signMessage(data.message);
      } else {
        addSocketStatus("Error: Cannot trigger sign - wallet not connected");
      }
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, [addSocketStatus, connectedAddress]);

  // Sign a message with MetaMask
  const signMessage = async (customMessage: string | null = null) => {
    if (!connectedAddress) {
      addSignStatus("Error: Wallet not connected");
      return;
    }

    clearSignStatus();
    addSignStatus("Preparing to sign message...");

    try {
      // Get ethereum provider
      if (!window.ethereum) {
        throw new Error("No Ethereum provider found. Please install MetaMask.");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Message to sign
      const message = customMessage || "Please sign this message to confirm your identity.";
      addSignStatus(`Message to sign: "${message}"`);

      // Request signature
      addSignStatus("Requesting signature - Check MetaMask popup...");
      const signature = await signer.signMessage(message);

      addSignStatus(`Signature successful!`);
      addSignStatus(`Signature: ${signature}`);

      // If connected to socket, send the result back to server
      if (socket && socket.connected) {
        socket.emit("signMessageResult", {
          account: connectedAddress,
          message,
          signature,
          timestamp: new Date().toISOString(),
        });
        addSignStatus("Signature result sent to server");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      addSignStatus(`Error: ${errorMessage}`);
      console.error("Error during signing:", err);

      // If connected to socket, send the error back to server
      if (socket && socket.connected) {
        socket.emit("signMessageResult", {
          error: errorMessage,
          timestamp: new Date().toISOString(),
        });
      }
    }
  };

  // Trigger the backend to initiate a sign request
  const triggerBackendSign = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/trigger-sign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Sign this message triggered from Next.js app at ${new Date().toISOString()}`,
        }),
      });

      const data = await response.json();
      console.log("Backend trigger response:", data);
      addSocketStatus(`Backend response: ${data.message}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Error triggering backend:", error);
      addSocketStatus(`Error triggering backend: ${errorMessage}`);
    }
  };

  return (
    <div className="flex flex-col gap-4 py-8 px-6 max-w-3xl mx-auto w-full">
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h2 className="card-title text-2xl">MetaMask Automation Demo</h2>

          {/* Socket Connection Status */}
          <div className="bg-base-200 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <div className={`w-3 h-3 rounded-full mr-2 ${isSocketConnected ? "bg-green-500" : "bg-red-500"}`}></div>
              <h3 className="text-lg font-medium">
                Backend Connection: {isSocketConnected ? "Connected" : "Disconnected"}
              </h3>
            </div>
            <button className="btn btn-primary mt-2" onClick={triggerBackendSign}>
              Trigger Sign from Backend
            </button>
            <div className="mt-4 bg-base-300 p-3 rounded-md max-h-32 overflow-y-auto">
              {socketStatusMessages.map((message, index) => (
                <p key={`socket-${index}`} className="text-sm">
                  {message}
                </p>
              ))}
            </div>
          </div>

          {/* Sign Message Section */}
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">Sign Message</h3>
            <button className="btn btn-secondary" onClick={() => signMessage()} disabled={!connectedAddress}>
              Sign Message with MetaMask
            </button>
            <div className="mt-4 bg-base-300 p-3 rounded-md max-h-32 overflow-y-auto">
              {signStatusMessages.map((message, index) => (
                <p key={`sign-${index}`} className="text-sm">
                  {message}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
