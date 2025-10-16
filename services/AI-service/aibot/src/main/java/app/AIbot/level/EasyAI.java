package app.AIbot.level;

import app.AIbot.AIbot;
import app.AIbot.model.BotAction;
import app.AIbot.model.game.GameState;

public class EasyAI implements AIbot {
	private static final long COOLDOWN_MS = 10;

	@Override
	public BotAction decideAction(GameState gameState, int currentPaddleY){
		int ballY = gameState.getBallY();
		if (ballY < currentPaddleY - 5)
			return BotAction.MOVE_UP;
		else if (ballY > currentPaddleY + 5)
			return BotAction.MOVE_DOWN;
		return BotAction.STAY;
	}

	@Override
	public long getCooldown() { return COOLDOWN_MS; }

	@Override
	public String getDifficulty() { return "easy"; }

}
