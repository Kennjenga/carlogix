# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/deploy.js || npx hardhat run ./ignition/modules/deploy.js --network lisk-sepolia
npx hardhat verify --network lisk-sepolia <deployed address>

```

contract address
Deploying contracts to Avalanche Fuji Testnet...
Deploying contracts with the account: 0xC63Ee3b2ceF4857ba3EA8256F41d073C88696F99
Using USDT address: 0xb9c31ea1d475c25e58a1be1a46221db55e5a7c6e
Deploying StringUtils library...
StringUtils deployed to: 0xd8D14616eEC8411b5ebE5B271189c4e1acbB025c
Deploying PoolLibrary library...
PoolLibrary deployed to: 0xA3F080C8b00d54E182325C2172bF32DE1D5E7A67
Deploying RateOracle contract...
RateOracle deployed to: 0x72aFEAdE1591F3fe2Cd5c373Bc55a613ccd21063
Getting currency pair constants from RateOracle...
AVAX_USDT constant: 0x8f238edb608f77ab03e7dddd3e81caa7b2abb7b24038a1fd2c7d9e9c0eccb353
USDT_KES constant: 0xc144e485faae71245421f1be49bf2267161473915c7467ccc3ab77e676c038ca
Setting exchange rates from CoinGecko data...
AVAX/USDT: 31.27
USDT/KES: 130.5
Updating AVAX/USDT rate...
AVAX/USDT rate updated successfully
Updating USDT/KES rate...
USDT/KES rate updated successfully
Exchange rates updated successfully
Deploying CarNFT...
CarNFT deployed to: 0xa857caf075Cb9060e4C9B589ff2Df43731e0EB32
Deploying CarInsurancePool...
CarInsurancePool deployed to: 0xbb760e2ad9c6DAD676be1414b53a874b92dD82bf
Minimum monthly premium set to: 0.1 USDT (for testing)
Maximum coverage multiplier set to: 10x
Default stablecoin set to USDT: 0xb9c31ea1d475c25e58a1be1a46221db55e5a7c6e
Using RateOracle at: 0x72aFEAdE1591F3fe2Cd5c373Bc55a613ccd21063
Generating ABIs for frontend integration...
Deployment complete!

<!-- market -->

Deploying contracts to Avalanche Fuji Testnet...
Deploying contracts with the account: 0xC63Ee3b2ceF4857ba3EA8256F41d073C88696F99
Using USDT address: 0xb9c31ea1d475c25e58a1be1a46221db55e5a7c6e
Deploying StringUtils library...
StringUtils deployed to: 0x6D0E7A3653C96b3f1552Ec42a44F99341f8B66f1
Deploying PoolLibrary library...
PoolLibrary deployed to: 0xC9a59C3c247Cf4Cec14aE84E3c9B9F2F28ba2D97
Deploying RateOracle contract...
RateOracle deployed to: 0x26f3b113140998a38fc8A30676E7b3c1915ec67D
Getting currency pair constants from RateOracle...
AVAX_USDT constant: 0x8f238edb608f77ab03e7dddd3e81caa7b2abb7b24038a1fd2c7d9e9c0eccb353
USDT_KES constant: 0xc144e485faae71245421f1be49bf2267161473915c7467ccc3ab77e676c038ca
Setting exchange rates from CoinGecko data...
AVAX/USDT: 31.27
USDT/KES: 130.5
Updating AVAX/USDT rate...
AVAX/USDT rate updated successfully
Updating USDT/KES rate...
USDT/KES rate updated successfully
Exchange rates updated successfully
Deploying CarNFT...
CarNFT deployed to: 0xd9e1552e5E013FD1F99aEF19FE84897685ff8E3e
Deploying CarMarketplace...
CarMarketplace deployed to: 0x82050430B2b12FeBF459Fe928033CA738Cae0C46
Deploying CarInsurancePool...
CarInsurancePool deployed to: 0x6B4e2555F10814929ffb17fbFFa892F449FA0461
Minimum monthly premium set to: 0.1 USDT (for testing)
Maximum coverage multiplier set to: 10x
Default stablecoin set to USDT: 0xb9c31ea1d475c25e58a1be1a46221db55e5a7c6e
Using RateOracle at: 0x26f3b113140998a38fc8A30676E7b3c1915ec67D
Generating ABIs for frontend integration...
Deployment complete!
