package app.AIbot.model.messages;

public class ReadyMessage {
	private String type;
	private String playerId;
	private String gameId;

	public ReadyMessage(String type, String botId, String gameId){
		this.type = type;
		this.playerId = botId;
		this.gameId = gameId;
	}

	public String getType(){
		return this.type;
	}

	public String getPlayerId(){
		return this.playerId;
	}

	public String getGameId(){
		return this.gameId;
	}
}
