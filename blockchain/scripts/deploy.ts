import hre from "hardhat";

async function main() {
  console.log("Deploying TournamentScores contract to Avalanche Fuji...");

  // Deploy using Ignition
  const { TournamentScores } = await import("../ignition/modules/TournamentScores");
  const deployment = await hre.ignition.deploy(TournamentScores);

  const address = await deployment.tournamentScores.getAddress();
  
  console.log("\n🚀 TournamentScores deployed successfully!");
  console.log("Contract address:", address);
  console.log("\n📝 Next steps:");
  console.log("1. Save this address to your .env file:");
  console.log(`   CONTRACT_ADDRESS=${address}`);
  console.log("\n2. View on Snowtrace:");
  console.log(`   https://testnet.snowtrace.io/address/${address}`);
  console.log("\n3. Verify the contract (optional):");
  console.log(`   npx hardhat verify --network fuji ${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
  
// import { ethers } from "@nomicfoundation/hardhat-toolbox-mocha-ethers/ethers";

// async function main() {
//   console.log("Deploying TournamentScores contract to Avalanche Fuji...");

//   // Get the contract factory
//   const TournamentScores = await ethers.getContractFactory("TournamentScores");
  
  
//   // Deploy the contract
//   const tournamentScores = await TournamentScores.deploy();
  
//   // Wait for deployment to complete
//   await tournamentScores.waitForDeployment();
  
//   const address = await tournamentScores.getAddress();
  
//   console.log("TournamentScores deployed to:", address);
//   console.log("Save this address to your .env as CONTRACT_ADDRESS");
//   console.log("\nVerify on Snowtrace:");
//   console.log(`https://testnet.snowtrace.io/address/${address}`);
// }

// main()
//   .then(() => process.exit(0))
//   .catch((error) => {
//     console.error(error);
//     process.exit(1);
//   });