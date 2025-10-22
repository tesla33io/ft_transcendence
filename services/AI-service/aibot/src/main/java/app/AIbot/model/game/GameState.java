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

	public void setType(String type){
		this.type = type;
	}
	public void setStatus(String status){
		this.status = status;
	}

	public void setPlayer(Player player){
		this.player = player;
	}

	public void setOpponent(Player opponent){
		this.opponent = opponent;
	}

	public void setBall(Ball ball){
		this.ball = ball;
	}

	public String getType(){
		return this.type;
	}

	public String getStatus(){
		return this.status;
	}

	public Player getPlayer(){
		return this.player;
	}

	public Player getOpponent(){
		return this.opponent;
	}

	public Ball getBall(){
		return this.ball;
	}

	public long getTimestamp(){
		return this.timestamp;
	}

	public int getBallY(){
		return ball.getY();
	}

	public int getBallX(){
		return ball.getX();
	}

	public int getX(){
		return player.getX();
	}

	public int getY(){
		return player.getY();
	}

	public int getBallVy(){
		return ball.getVy();
	}

	public int getBallVx(){
		return ball.getVx();
	}

}



