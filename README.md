# ft_transcendence
Send:
For login:
send Username and password
--->get back token if vaild ? (log nummber of wrong logins ?)

For register send:
Usernamen, Password, if2Factor,AvatarUrl,bio(string caped to 128 char)
---> User created succesfuly or error for example username exist already

For Settings:
NewAvatarUrl, newName, newBioText,newPassword(and check vaild/no duplicate names etc.)
--->get some return "updates succesuly"?

FriendRequest:
	FriendsName,Date
----> request send succesuly or error user dosent exist ? 

AcceptFriendRequest:
	myUserID,myUsername,otherUserName


Get:

FriendRequests:
listofRequests,
for each:
	userId,UserName,requestSendDate, 

FriendsComponent:
listOfAllFriends
for each:
	userId, userName, isOnline(or status if we track inGame?), lastOnlineAt,

For Elo component(used in online game setup page):
PlayerName,Id,Current Rating,Highest Rating,eloGain/los since last game.

1v1 Basic Statics:
UserId, Usernamen, gamesWon, gamesLost, win/losesPercentage, curentWinStreak?, longestWinStreak?, 

playervsAi:
userId,UserName, gamesWon, gamesLost,win/losesPercentage, curentWinStreak?, longestWinStreak?

For Tournamnet statistic component:
TournamentWins,Tounraments Participated,win/losesPercentage


Match history Component:(we dont need match history for tournaments, only 1v1 games)
List of all matches
For each Match:
	match id, OpponentId, opponentName, isWin, userScore, opponentScore, date, opponentElo(at that time), Elogained/lost(at this game).

For profilePage:
userId, userName, AvatarUrl, BioText, isOnline, lastOnline, accountCreationDate,