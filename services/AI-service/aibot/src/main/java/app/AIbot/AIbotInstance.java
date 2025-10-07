package app.AIbot;

import app.AIbot.websocket.WebSocketGameClient;

public class AIbotInstance {
	private volatile String botId;
	private volatile String gameId;
	private volatile AIbot ai;
	private volatile WebSocketGameClient ws;

	private volatile long lastActionTime = 0;
	private volatile int paddleY = 0;

	public AIbotInstance(String botId, String gameId, AIbot ai){
		this.botId = botId;
		this.gameId = gameId;
		this.ai = ai;
		//connect to the ws and then assign to the ws
	}

	public String getBotId() {return botId;}
	public String getGameId() {return gameId;}
}
