package app.AIbot.websocket;

import org.springframework.stereotype.Component;
import jakarta.annotation.PostConstruct;

//this.ws = new WebSocket(`ws://${window.location.hostname}:3000/ws/${this.gameMode}?playerId=${this.playerId}`)
@Component
public class WebSocketGameClient {

	@PostConstruct
	public void connect(){

	}
}
