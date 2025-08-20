POST /api/join-classic
JSON Request:
{
	playerName: (string)
	playerId: (string)
	gameMode: 'classic'
}

Return:

status: Waiting
{
	status: (string)
	playerId: (string)
}
client should connect to localhost:8080?playerId=${playerId} with their ID (mayber need to refrector it later)
status: connected
{
	status: (string)
	playerId: (string)
	gameId: (string)
}
client should connect to localhost:8080?playerId=${playerId} with their ID(mayber need to refrector it later)

client -> render game UI
client -> send to server via websocket that it is ready to play
{
	status: ready (string)
	gameId: (string)
	playerId: (string)
}

During the game client get from server
{
	status: 'playing' (string)
	gameid: (string) //maybe not needed
	player: {
		id: (string) //maybe not needed
		name: (string) //maybe not needed
		X: (number)
		Y: (number)
		score: (number)
		ready: (boolean)
	}
	opponent:{
		id: (string) //maybe not needed
		name: (string) //maybe not needed
		X: (number)
		Y: (number)
		score: (number)
		ready: (boolean)
	}
	ball:{
		x: (number)
		y: (number)
	}
}

for movement client send through the socket
{
	status: 'paddle_move'
	gameId: (string)
	playerId: (string)
	deltaY: (number)
}
