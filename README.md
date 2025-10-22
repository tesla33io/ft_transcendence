# ft_transcendence

{
	gameMode: 'tournament',
	status: 'ready',
	id: tournament.id,
	player1: tournament.players[0],
	player2: tournament.players[1],
	player3: tournament.players[2],
	player4: tournament.players[3]
	finalist1: string //name of player or null 
	finalist2: string //name of player or null
	champion: string //name of player or null
}

//websocket messaging struct 
{
	"event": string ,//for example "error" or "gameUpdate" etc
	"type": string ,//for example on game update "paddleMove" or "scoreUpdate" etc
	"data": any //json object with all needed data for the event and type 
}
