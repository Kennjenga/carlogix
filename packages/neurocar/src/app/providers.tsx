"use client";

import React, { ReactNode } from "react";
import "@rainbow-me/rainbowkit/styles.css";
import { lightTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { State, WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "@/blockchain/config/wagmi";

const queryClient = new QueryClient();

interface ProvidersProps {
  children: ReactNode;
  initialState?: State;
}

export const Providers: React.FC<ProvidersProps> = ({
  children,
  initialState,
}: ProvidersProps) => {
  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={lightTheme({
            accentColor: "#F0B90B",
            accentColorForeground: "#1E2026",
            borderRadius: "medium",
            fontStack: "system",
          })}
          showRecentTransactions={true}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
