package app.AIbot.level;

import app.AIbot.AIbot;
import app.AIbot.model.BotAction;
import app.AIbot.model.GameState;

public class EasyAI implements AIbot {
	private static final long COOLDOWN_MS = 1000;

	@Override
	public BotAction decideAction(GameState gameState, int currentPaddleY){
		int ballY = gameState.getBallY();
		int paddleY = gameState.getPaddleX();

		if (ballY < paddleY)
			return BotAction.MOVE_UP;
		else if (ballY > paddleY)
			return BotAction.MOVE_DOWN;
		return BotAction.STAY;
	}

	@Override
	public long getCooldown() { return COOLDOWN_MS; }

	@Override
	public String getDifficulty() { return "easy"; }
}
