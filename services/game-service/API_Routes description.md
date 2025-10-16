/api/v1/join-tournament

server send waiting | server tournament ready/prepared

client send ready state/msg for tournamnet

sever send game/match is ready

client send ready state/msg for game

server start the game

JSON types:
'classic_notification'
'tournament_notification'
'game_state'

game_state JSON:
{"type":"game_state","status":"playing","player":{"id":"bot_6gfiszpk1vu","name":"bot","score":3,"Y":225,"X":880,"ready":true},"opponent":{"id":"32760","name":"test1","score":0,"Y":225,"X":20,"ready":true},"ball":{"x":450,"y":506.617334507742,"vx":2,"vy":2}}
