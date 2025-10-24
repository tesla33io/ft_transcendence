package app.AIbot;

import app.AIbot.websocket.WebSocketGameClient;
import app.AIbot.config.SpringContext;
import app.AIbot.model.BotAction;
import app.AIbot.model.game.GameState;

public class AIbotInstance {
	private volatile String botId;
	private volatile String gameId;
	private volatile AIbot ai;
	private volatile WebSocketGameClient ws;
	private volatile GameState currentGameState;

	private volatile BotAction action = BotAction.STAY;
	private volatile long lastActionTime = 0;

	public AIbotInstance(String botId, String gameId, AIbot ai){
		this.botId = botId;
		this.gameId = gameId;
		this.ai = ai;
		this.ws = new WebSocketGameClient();

		ws.setDisconnectCallback(() -> {
			System.out.println("WebSocket closed for bot " + botId + ", cleaning up instance.");
			SpringContext.getBean(AIbotManager.class).removeBot(botId);
		});

		System.out.println("try to connect to websocket");
		this.connectToGame();
	}

	private void connectToGame(){
		String gameMode = "classic"; // hard coded right now
		ws.connect(botId, gameId, gameMode, this::onGameState);
	}

	public synchronized void onGameState(GameState gameState){

		long now = System.currentTimeMillis();
		if (now - lastActionTime > ai.getCooldown()){
			this.currentGameState = gameState;
			lastActionTime = now;
			ai.decideAction(this.currentGameState, true);
		}

		try {
			this.action = ai.decideAction(this.currentGameState, false);
			if (this.action != BotAction.STAY){
				ws.sendAction(action);
			}
		}
		catch (Exception e){
			System.err.println("Error in bot instance {" + botId + "}: " + e);
		}
	}

	public void disconnect(){
		if(ws != null){
			System.out.println("disconnect function");
			ws.disconnect();
		}
	}

	public String getBotId() {return botId;}
	public String getGameId() {return gameId;}
}
