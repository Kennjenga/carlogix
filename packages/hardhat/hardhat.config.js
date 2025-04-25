require("@nomicfoundation/hardhat-ignition/modules");
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: ".env" });

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  networks: {
    hardhat: {
      allowUnlimitedContractSize: false,
    },
    avalancheFujiTestnet: {
      url: "https://api.avax-test.network/ext/bc/C/rpc", // RPC URL for Fuji Testnet
      chainId: 43113, // Chain ID for Fuji Testnet
      accounts: [process.env.WALLET_PRIVATE_KEY], // Your private key (make sure it has funds on Fuji)
      // gasPrice: 225000000000, // You might need to adjust gas price for the testnet
    },
    sepolia: {
      url: process.env.ALCHEMY_API_KEY_SEPOLIA,
      accounts: [process.env.WALLET_PRIVATE_KEY],
      // timeout: 60000,
    },
  },
  sourcify: {
    enabled: false,
  },

  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1, // Optimizing for deployment size rather than runtime efficiency
      },
      viaIR: true,
    },
  },
};
