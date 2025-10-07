package app.AIbot;

import app.AIbot.model.BotAction;
import app.AIbot.model.GameState;

public interface AIbot {
	BotAction decideAction(GameState gameState, int currentPaddleY);
	long getCooldown();
	String getDifficulty();
}

