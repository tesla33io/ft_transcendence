package app.AIbot;
import app.AIbot.level.EasyAI;

public class AIbotBuilder {
	public static AIbot createBot(String botDiff){
		switch (botDiff){
			case "easy":
				return new EasyAI();
			default:
				return new EasyAI();
		}
	}
}
