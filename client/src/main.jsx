import "@rainbow-me/rainbowkit/styles.css";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Toaster } from "react-hot-toast";
import { defineChain } from "viem";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

const queryClient = new QueryClient();
const EDUChain = defineChain({
  id: 656476,
  name: "EDU Chain Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Open Campus Codex Sepolia by dRPC",
    symbol: "EDU",
  },
  rpcUrls: {
    default: {
      http: ["https://open-campus-codex-sepolia.drpc.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "EDU Chain Testnet explorer",
      url: "https://opencampus-codex.blockscout.com",
    },
  },
  testnet: true,
});

export const config = getDefaultConfig({
  appName: "fixedYieldprotocol",
  projectId: "547e0ccd462ecc58480dc3432393574c",
  chains: [EDUChain],
  ssr: true, // If your dApp uses server side rendering (SSR)
});

createRoot(document.getElementById("root")).render(
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider showRecentTransactions={true}>
        <StrictMode>
          <App />

          <Toaster position="bottom-right" reverseOrder={true} />
        </StrictMode>
      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
);
