package app.AIbot.level;

import app.AIbot.AIbot;
import app.AIbot.model.BotAction;
import app.AIbot.model.game.GameState;

public class EasyAI implements AIbot {
	private static final long COOLDOWN_MS = 10;

	@Override
	public BotAction decideAction(GameState gameState){
		int ballY = gameState.getBallY();
		int ballX = gameState.getBallX();
		int paddleY = gameState.getY();
		int paddleX = gameState.getX();

		if (paddleX == 20 && ballX > 650){
			if (ballY < 550 / 2)
				return BotAction.MOVE_DOWN;
			else
				return BotAction.MOVE_UP;
		}
		else if (paddleX == 880 && ballX < 250){
			if (ballY < 550 / 2)
				return BotAction.MOVE_DOWN;
			else
				return BotAction.MOVE_UP;
		}

		if (ballY < paddleY - 15)
			return BotAction.MOVE_UP;
		else if (ballY > paddleY + 15)
			return BotAction.MOVE_DOWN;
		return BotAction.STAY;
	}

	@Override
	public long getCooldown() { return COOLDOWN_MS; }

	@Override
	public String getDifficulty() { return "easy"; }

}
