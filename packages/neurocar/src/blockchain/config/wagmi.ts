import { getDefaultConfig, getDefaultWallets } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';
import {
  argentWallet,
  trustWallet,
  ledgerWallet,
  coreWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { http, createStorage, cookieStorage } from 'wagmi';

if (!process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID) {
  throw new Error('Missing NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID');
}

// Define a custom Fuji testnet chain with the correct RPC URL
const customFujiTestnet = {
  id: 43113,
  name: 'Avalanche Fuji C-Chain',
  network: 'fuji',
  nativeCurrency: {
    name: 'Avalanche',
    symbol: 'AVAX',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://api.avax-test.network/ext/bc/C/rpc'],
    },
    public: {
      http: ['https://api.avax-test.network/ext/bc/C/rpc'],
    },
  },
  blockExplorers: {
    default: {
      name: 'SnowTrace',
      url: 'https://testnet.snowtrace.io',
    },
  },
  testnet: true,
};

const { wallets } = getDefaultWallets();

export const config = getDefaultConfig({
  appName: 'Neurocar',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
  wallets: [
    ...wallets,
    {
      groupName: "Other",
      wallets: [coreWallet, argentWallet, trustWallet, ledgerWallet], 
    },
  ],
  chains: [
    sepolia,
    customFujiTestnet  // Use the custom chain definition
  ],
  transports: {
    [sepolia.id]: http(`https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`),
    [customFujiTestnet.id]: http('https://api.avax-test.network/ext/bc/C/rpc'),  // Use the correct RPC URL
  },
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
});