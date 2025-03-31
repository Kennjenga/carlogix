import { getDefaultConfig, getDefaultWallets } from '@rainbow-me/rainbowkit';
import { hederaTestnet, sepolia } from 'wagmi/chains';
import {
  argentWallet,
  trustWallet,
  ledgerWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { http, createStorage, cookieStorage } from 'wagmi';

if (!process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID) {
  throw new Error('Missing NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID');
}

// Define a custom Hedera testnet chain with the correct RPC URL
const customHederaTestnet = {
  ...hederaTestnet,
  rpcUrls: {
    ...hederaTestnet.rpcUrls,
    default: {
      http: ['https://testnet.hashio.io/api'],
    },
    public: {
      http: ['https://testnet.hashio.io/api'],
    },
  }
};

const { wallets } = getDefaultWallets();

export const config = getDefaultConfig({
  appName: 'Neurocar',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
  wallets: [
    ...wallets,
    {
      groupName: "Other",
      wallets: [argentWallet, trustWallet, ledgerWallet],
    },
  ],
  chains: [
    sepolia,
    customHederaTestnet  // Use the custom chain definition
  ],
  transports: {
    [sepolia.id]: http(`https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`),
    [hederaTestnet.id]: http('https://testnet.hashio.io/api'),  // Use the correct RPC URL
  },
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
});