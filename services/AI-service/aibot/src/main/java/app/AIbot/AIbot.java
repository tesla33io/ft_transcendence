package app.AIbot;

import app.AIbot.model.BotAction;
import app.AIbot.model.game.GameState;

public interface AIbot {
	BotAction decideAction(GameState gameState, boolean update);
	long getCooldown();
	String getDifficulty();
}

