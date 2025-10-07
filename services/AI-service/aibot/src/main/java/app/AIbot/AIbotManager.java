package app.AIbot;

import java.util.HashMap;

public class AIbotManager {
	HashMap<String, String> instances = new HashMap<>();

	public String getIntance(String botId){
		if (instances.containsKey(botId))
			return instances.get(botId);
		else {
			String bot = "testBOT";
			instances.put(botId, bot);
			return bot;
		}
	}
}
