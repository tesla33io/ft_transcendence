package app.AIbot;

import app.AIbot.websocket.WebSocketGameClient;
import app.AIbot.model.BotAction;
import app.AIbot.model.GameState;;

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
		//connection to the ws and then assign to the ws
	}

	public synchronized void onGameState(GameState gameState){
		this.paddleY = gameState.getBallY();

		long now = System.currentTimeMillis();
		if (now - lastActionTime < ai.getCooldown())
			return ;
		try {
			BotAction action = ai.decideAction(gameState, paddleY);
			if (action != BotAction.STAY){
				lastActionTime = now;
			}
		}
		catch (Exception e){
			System.err.println("Error in bot instance {" + botId + "}: " + e);
		}
	}

	public String getBotId() {return botId;}
	public String getGameId() {return gameId;}
}
