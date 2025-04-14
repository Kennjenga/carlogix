require("@nomicfoundation/hardhat-ignition/modules");
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: ".env" });

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  networks: {
    hardhat: {
      allowUnlimitedContractSize: false,
    },
    avalanche: {
      url: "https://api.avax.network/ext/bc/C/rpc", // RPC URL for Avalanche
      accounts: [process.env.WALLET_PRIVATE_KEY], // Private key for your wallet
      gasPrice: 225000000000, // Gas price in wei
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
        runs: 800,
      },
    },
  },
};
