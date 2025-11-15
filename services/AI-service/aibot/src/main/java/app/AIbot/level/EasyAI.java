package app.AIbot.level;

import app.AIbot.AIbot;
import app.AIbot.model.BotAction;
import app.AIbot.model.game.GameState;

public class EasyAI implements AIbot {
	private static final long COOLDOWN_MS = 1000;
	private int paddleY = -1;
	private int desireY = -1;
	private String player_offset_str = System.getenv("PLAYER_OFFSET") != null ? System.getenv("PLAYER_OFFSET") : "20";
	private int PLAYER_OFFSET = Integer.parseInt(player_offset_str);

	@Override
	public BotAction decideAction(GameState gameState, boolean update){
		int ballY = gameState.getBallY();
		int ballX = gameState.getBallX();
		int ballVx = gameState.getBallVx();

		if (update){
			this.paddleY = gameState.getY();
			if ((gameState.getX() == PLAYER_OFFSET && ballVx > 0) ||
				(gameState.getX() == 900 - PLAYER_OFFSET && ballVx < 0) ){

			}
			else{
				int frame_to_reach = gameState.getBallVx() != 0 ? (gameState.getX() - ballX) / gameState.getBallVx() : 0;
				int Y = ballY + gameState.getBallVy() * frame_to_reach;

				if (Y < 0){
					Y *= -1;
				}
				else if (Y > 550){
					Y = 550 - (Y - 550);
					System.out.println("over reach" + Y);
				}

				this.desireY = Y;
			}
		}

		if ((gameState.getX() == 20 && ballVx > 0) ||
			(gameState.getX() == 880 && ballVx < 0) )
			this.desireY = 550 / 2;


		if (desireY < this.paddleY - 15){
			this.paddleY -= 10;
			return BotAction.MOVE_UP;
		}
		else if (desireY > this.paddleY + 15){
			this.paddleY += 10;
			return BotAction.MOVE_DOWN;
		}
		return BotAction.STAY;
	}

	@Override
	public long getCooldown() { return COOLDOWN_MS; }

	@Override
	public String getDifficulty() { return "easy"; }

}
