const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying contracts to Avalanche Fuji Testnet...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  try {
    // Use a lowercase version of the USDT address to avoid checksum issues
    const usdtAddress = "0xb9c31ea1d475c25e58a1be1a46221db55e5a7c6e";
    console.log(`Using USDT address: ${usdtAddress}`);
    
    // Using 0.1 USDT for testing as requested
    const minMonthlyPremiumUsdt = ethers.parseUnits("0.1", 6); // 0.1 USDT in base units
    
    // Maximum coverage multiplier (10x) as discussed for the Kenyan market
    const maxCoverageMultiplier = 10;

    console.log("Deploying StringUtils library...");
    const StringUtils = await ethers.getContractFactory("StringUtils");
    const stringUtils = await StringUtils.deploy();
    await stringUtils.waitForDeployment();
    console.log(`StringUtils deployed to: ${await stringUtils.getAddress()}`);

    console.log("Deploying PoolLibrary library...");
    const PoolLibrary = await ethers.getContractFactory("PoolLibrary");
    const poolLibrary = await PoolLibrary.deploy();
    await poolLibrary.waitForDeployment();
    console.log(`PoolLibrary deployed to: ${await poolLibrary.getAddress()}`);

    console.log("Deploying RateOracle contract...");
    const RateOracle = await ethers.getContractFactory("RateOracle");
    const rateOracle = await RateOracle.deploy();
    await rateOracle.waitForDeployment();
    const rateOracleAddress = await rateOracle.getAddress();
    console.log(`RateOracle deployed to: ${rateOracleAddress}`);

    // Get the contract constants directly from the deployed contract
    console.log("Getting currency pair constants from RateOracle...");
    const AVAX_USDT = await rateOracle.AVAX_USDT();
    const USDT_KES = await rateOracle.USDT_KES();
    console.log(`AVAX_USDT constant: ${AVAX_USDT}`);
    console.log(`USDT_KES constant: ${USDT_KES}`);

    // Example rates from CoinGecko (normally would be fetched in real-time)
    // 1 AVAX = 31.27 USDT (as of April 2025)
    const avaxUsdtRate = ethers.parseUnits("31.27", 6);
    // 1 USDT = 130.5 KES (as of April 2025)
    const usdtKesRate = ethers.parseUnits("130.5", 6);

    console.log(`Setting exchange rates from CoinGecko data...`);
    console.log(`AVAX/USDT: ${ethers.formatUnits(avaxUsdtRate, 6)}`);
    console.log(`USDT/KES: ${ethers.formatUnits(usdtKesRate, 6)}`);

    // Update rates one at a time to isolate any potential issues
    console.log("Updating AVAX/USDT rate...");
    const tx1 = await rateOracle.updateRate(AVAX_USDT, avaxUsdtRate);
    await tx1.wait();
    console.log("AVAX/USDT rate updated successfully");

    console.log("Updating USDT/KES rate...");
    const tx2 = await rateOracle.updateRate(USDT_KES, usdtKesRate);
    await tx2.wait();
    console.log("USDT/KES rate updated successfully");
    console.log("Exchange rates updated successfully");

    // Deploy CarNFT without linking libraries
    console.log("Deploying CarNFT...");
    const CarNFT = await ethers.getContractFactory("CarNFT");
    const carNFT = await CarNFT.deploy();
    await carNFT.waitForDeployment();
    const carNFTAddress = await carNFT.getAddress();
    console.log(`CarNFT deployed to: ${carNFTAddress}`);

    // Deploy CarInsurancePool without linking libraries
    console.log("Deploying CarInsurancePool...");
    const CarInsurancePool = await ethers.getContractFactory(
      "CarInsurancePool"
    );

    const carInsurancePool = await CarInsurancePool.deploy(
      carNFTAddress,
      minMonthlyPremiumUsdt,
      maxCoverageMultiplier,
      usdtAddress,
      rateOracleAddress
    );

    await carInsurancePool.waitForDeployment();
    const carInsurancePoolAddress = await carInsurancePool.getAddress();

    console.log(`CarInsurancePool deployed to: ${carInsurancePoolAddress}`);
    console.log(`Minimum monthly premium set to: 0.1 USDT (for testing)`);
    console.log(
      `Maximum coverage multiplier set to: ${maxCoverageMultiplier}x`
    );
    console.log(`Default stablecoin set to USDT: ${usdtAddress}`);
    console.log(`Using RateOracle at: ${rateOracleAddress}`);

    // Generate ABIs for frontend
    console.log("Generating ABIs for frontend integration...");

    console.log("Deployment complete!");
  } catch (error) {
    console.error("Deployment failed with error:", error);
    // Log the error's properties for better debugging
    if (error && typeof error === "object") {
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        argument: error.argument,
        value: error.value,
      });
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
