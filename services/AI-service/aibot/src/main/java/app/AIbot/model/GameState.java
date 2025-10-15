package app.AIbot.model;

public class GameState {
	private String gameId;
	private String botId;
	private int ballX, ballY;
	private int ballvX, ballvY;
	private int botPaddleY;
	private int botPaddleX;
	private int playerPaddleY;
	private int playerPaddleX;
	private long timestamp;

	public int getBallY(){
		return ballY;
	}

	public int getBallX(){
		return ballX;
	}

	public int getPaddleY(){
		return botPaddleY;
	}

	public int getPaddleX(){
		return botPaddleX;
	}
}



