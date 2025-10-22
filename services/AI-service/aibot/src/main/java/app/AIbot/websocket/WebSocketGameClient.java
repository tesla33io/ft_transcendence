package app.AIbot.websocket;

import java.util.function.Consumer;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.client.WebSocketConnectionManager;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.fasterxml.jackson.databind.ObjectMapper;

import app.AIbot.model.BotAction;
import app.AIbot.model.BotActionMessage;
import app.AIbot.model.game.GameState;
import app.AIbot.model.messages.BaseMessage;
import app.AIbot.model.messages.ReadyMessage;

//each bot need to connect to the server via websocket

@Component
public class WebSocketGameClient {
	private WebSocketSession session;
	private final ObjectMapper objectMapper = new ObjectMapper();
	private String botId;
	private String gameId;
	private Consumer<GameState> gameStateHandler;
	private Runnable onDisconnectCallback;

	private static final String WEBSOCKET_URL = "ws://gateway-service:3000/ws/%s?playerId=%s";

	public void setDisconnectCallback(Runnable callback){
		this.onDisconnectCallback = callback;
	}

	public void connect(String botId, String gameId, String gameMode, Consumer<GameState> gameStateHandler){
		this.botId = botId;
		this.gameId = gameId;
		this.gameStateHandler = gameStateHandler;

		String url = String.format(WEBSOCKET_URL, gameMode, botId);

		WebSocketConnectionManager connectionManager = new WebSocketConnectionManager(
			new StandardWebSocketClient(),
			new BotWebSocketHandler(),
			url
		);

		connectionManager.start();
	}

	public void sendAction(BotAction action){
		if (session != null && session.isOpen()){
			try {
				int deltaY = action == BotAction.MOVE_UP ? -10 : 10;
				BotActionMessage message = new BotActionMessage("paddle_move",botId, gameId, deltaY);
				String jsonMessage = objectMapper.writeValueAsString(message);
				session.sendMessage(new TextMessage(jsonMessage));
			} catch (Exception e) {
				System.err.println("Failed to send action: " + e.getMessage());
			}
		}
	}

	public void disconnect(){
		if (session != null && session.isOpen()){
			try{
				session.close();
			} catch (Exception e){
				System.err.println("Error in disconnect :" + e.getMessage());
			}
		}
	}


	private class BotWebSocketHandler extends TextWebSocketHandler {

		@Override
		public void afterConnectionEstablished(WebSocketSession session){
			WebSocketGameClient.this.session = session;
			System.out.println("Bot " + botId + " connected to the game " + gameId);
		}

		@Override
		public void handleTextMessage(WebSocketSession session, TextMessage message){
			try {
				String payload = message.getPayload();
				BaseMessage baseMessage = objectMapper.readValue(payload, BaseMessage.class);

				if ("classic_notification".equals(baseMessage.type) && "connected".equals(baseMessage.status))
					this.readyMessageHandling();
				else if ("classic_notification".equals(baseMessage.type) && "finished".equals(baseMessage.status))
					this.finnishedMessageHandling();
				else if ("game_state".equals(baseMessage.type) && "playing".equals(baseMessage.status))
					this.gameStateMessageHandling(payload);
				else
					System.err.println("Unknown message type/status: " + baseMessage.type + " / " + baseMessage.status);
			}
			catch (Exception e){
				System.err.println("Failed to parse game state: " + e.getMessage());
			}
		}

		@Override
		public void handleTransportError(WebSocketSession session, Throwable exception) {
			System.err.println("WebSocket transport error for bot " + botId + " : " + exception.getMessage() );
		}

		@Override
		public void afterConnectionClosed(WebSocketSession session, CloseStatus closeStatus) {
			System.err.println("Bot " + botId + " disconnected from game");
			WebSocketGameClient.this.session = null;

			if (onDisconnectCallback != null){
				onDisconnectCallback.run();
			}
		}

		private void readyMessageHandling(){
			try {
				System.out.println("classic notification! " + WebSocketGameClient.this.botId + " " + WebSocketGameClient.this.gameId);
				ReadyMessage readyMessage = new ReadyMessage("ready", WebSocketGameClient.this.botId, WebSocketGameClient.this.gameId);
				String jsonResponse = objectMapper.writeValueAsString(readyMessage);
				session.sendMessage(new TextMessage(jsonResponse));
				System.out.println("Created msg: " + jsonResponse);
			}
			catch (Exception e){
				System.err.println("Error in ready message handling" + e);
			}
		}

		private void finnishedMessageHandling(){
			try{
				System.out.println("Finnish notification! — disconnecting WebSocket.");
				session.close(CloseStatus.NORMAL);
			}
			catch (Exception e) {
				System.err.println("Error in finnish message handling: " + e);
			}
		}

		private void gameStateMessageHandling(String payload){
			try{
				GameState gameState = objectMapper.readValue(payload, GameState.class);
				gameStateHandler.accept(gameState);
			}
			catch (Exception e){
				System.err.println("Error in gamestate message handling: " + e);
			}
		}
	}
}


