package app.AIbot;

import java.util.HashMap;

public class AIbotManager {
	HashMap<String, String> instance = new HashMap<>();

	public String getIntance(String botId){
		if (instance.containsKey(botId))
			return instance.get(botId);
		else {
			String bot = AIbotBuilder.createBot("easy");
			instance.put(botId, bot);
			return bot;
		}
	}
}
