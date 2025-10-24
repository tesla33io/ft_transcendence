package app.AIbot.model;

public class BotActionMessage {
	private String type;
	private String botId;
	private String gameId;
	private int deltaY;

	public BotActionMessage(String type, String botId, String gameId, int deltaY){
		this.type = type;
		this.botId = botId;
		this.gameId = gameId;
		this.deltaY = deltaY;
	}

	public String getType(){
		return this.type;
	}

	public String getBotId(){
		return this.botId;
	}

	public String getGameId(){
		return this.gameId;
	}

	public int getDeltaY(){
		return this.deltaY;
	}
}
