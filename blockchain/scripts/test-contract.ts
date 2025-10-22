import hre from "hardhat";
import { ethers } from "ethers";

async function main() {
  console.log("Testing TournamentScores contract on Avalanche Fuji...\n");
  
  const contractAddress = "0xAC5C83eD911a846e968AF3E4B70907e03Cab31E5";
  
  const artifact = await hre.artifacts.readArtifact("TournamentScores");
  const provider = new ethers.JsonRpcProvider("https://api.avax-test.network/ext/bc/C/rpc");
  const wallet = new ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY!, provider);
  const contract = new ethers.Contract(contractAddress, artifact.abi, wallet);
  
  // Check owner
  const owner = await contract.owner();
  console.log("Contract Owner:", owner);
  
  // Get tournament count
  const count = await contract.getTournamentCount();
  console.log("Total Tournaments:", count.toString());
  
  // Try to verify a tournament (will be false if none recorded yet)
  const exists = await contract.verifyTournament(1);
  console.log("Tournament 1 exists:", exists);
  
  console.log("\n✅ Contract test complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });