import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("TournamentScores", (m) => {
  const tournamentScores = m.contract("TournamentScores");
  return { tournamentScores };
});