package app.AIbot.level;

import app.AIbot.AIbot;
import app.AIbot.model.BotAction;
import app.AIbot.model.game.GameState;

public class EasyAI implements AIbot {
	private static final long COOLDOWN_MS = 1000;
	private int paddleY = -1;
	private int desireY = -1;

	@Override
	public BotAction decideAction(GameState gameState, boolean update){
		int ballY = gameState.getBallY();
		int ballX = gameState.getBallX();

		if (update){
			this.paddleY = gameState.getY();
			int frame_to_reach = (gameState.getX() - ballX) / gameState.getBallVx();
			this.desireY = ballY + gameState.getBallVy() * frame_to_reach;
		}

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
