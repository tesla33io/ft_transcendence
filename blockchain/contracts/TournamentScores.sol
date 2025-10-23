// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TournamentScores {
    struct Tournament {
        uint256 tournamentId;
        uint256 timestamp;
        address winner;
        string winnerUsername;
        uint256 finalScore;
        string[] participants;
        bool verified;
    }
    
    // Mapping from tournament ID to Tournament data
    mapping(uint256 => Tournament) public tournaments;
   
   // Array to track all tournament IDs
    uint256[] public tournamentIds;
    address public owner;
    
    event TournamentRecorded(
        uint256 indexed tournamentId,
        address winner,
        string winnerUsername,
        uint256 finalScore,
        uint256 timestamp
    );
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    // Record a tournament result
    function recordTournament(
        uint256 _tournamentId,
        address _winner,
        string memory _winnerUsername,
        uint256 _finalScore,
        string[] memory _participants
    ) public onlyOwner {
        require(tournaments[_tournamentId].tournamentId == 0, "Tournament already recorded");
        
        tournaments[_tournamentId] = Tournament({
            tournamentId: _tournamentId,
            timestamp: block.timestamp,
            winner: _winner,
            winnerUsername: _winnerUsername,
            finalScore: _finalScore,
            participants: _participants,
            verified: true
        });
        
        tournamentIds.push(_tournamentId);
        
        emit TournamentRecorded(_tournamentId, _winner, _winnerUsername, _finalScore, block.timestamp);
    }
    
    // Get tournament details
    function getTournament(uint256 _tournamentId) public view returns (
        uint256 tournamentId,
        uint256 timestamp,
        address winner,
        string memory winnerUsername,
        uint256 finalScore,
        string[] memory participants,
        bool verified
    ) {
        Tournament memory t = tournaments[_tournamentId];
        return (
            t.tournamentId,
            t.timestamp,
            t.winner,
            t.winnerUsername,
            t.finalScore,
            t.participants,
            t.verified
        );
    }
    
    // Get total number of tournaments
    function getTournamentCount() public view returns (uint256) {
        return tournamentIds.length;
    }

    // Verify if a tournament exists on blockchain
    function verifyTournament(uint256 _tournamentId) public view returns (bool) {
        return tournaments[_tournamentId].verified;
    }
}