package app.AIbot.model.game;

import app.AIbot.model.game.Player;
import app.AIbot.model.game.Ball;

public class GameState {
	private String type;
	private String status;
	private Player player;
	private Player opponent;
	private Ball ball;
	private long timestamp;


	public int getBallY(){
		return ball.getY();
	}

	public int getBallX(){
		return ball.getX();
	}

	public long getTimestamp(){
		return this.timestamp;
	}
}



