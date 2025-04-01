const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying contracts to Hedera Testnet...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy CarNFT first
  const CarNFT = await ethers.getContractFactory("CarNFT");
  const carNFT = await CarNFT.deploy();
  await carNFT.waitForDeployment();

  const carNFTAddress = await carNFT.getAddress();
  console.log(`CarNFT deployed to: ${carNFTAddress}`);

  // Deploy CarInsurancePool with CarNFT address
  const CarInsurancePool = await ethers.getContractFactory("CarInsurancePool");
  const carInsurancePool = await CarInsurancePool.deploy(carNFTAddress);
  await carInsurancePool.waitForDeployment();

  const carInsurancePoolAddress = await carInsurancePool.getAddress();
  console.log(`CarInsurancePool deployed to: ${carInsurancePoolAddress}`);

  console.log("Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

// Deploying contracts to Hedera Testnet...
// Deploying contracts with the account: 0xBd87B618186038fe37AFf6F93154E14C00C43A49
// CarNFT deployed to: 0x2ae495E8D1c6331FCC2046BE8A91B45D758637FE
// CarInsurancePool deployed to: 0x338FA4C12De8a4bf9E6c7DEF28F2F56ee71034bE
// Deployment complete!

// Deploying contracts to Hedera Testnet...
// Deploying contracts with the account: 0xC63Ee3b2ceF4857ba3EA8256F41d073C88696F99
// CarNFT deployed to: 0xa857caf075Cb9060e4C9B589ff2Df43731e0EB32
// CarInsurancePool deployed to: 0xbb760e2ad9c6DAD676be1414b53a874b92dD82bf
// Deployment complete!
