package app.AIbot;

import java.util.concurrent.ConcurrentHashMap;

public class AIbotManager {
	private ConcurrentHashMap<String, AIbot> instance = new ConcurrentHashMap<>();

	public synchronized String createBot(String gameId, String difficulty){
		final String botId = generateBotId(gameId);

		AIbot bot = AIbotBuilder.createBot("easy");
		instance.put(botId, bot);
		System.out.println("Created bot: " + botId + " for game: " + gameId);
		return botId;
	}

	public AIbot getIntance(String botId){
		if (instance.containsKey(botId))
			return instance.get(botId);
		else
			return null;
	}

	public void removeBot(String botId){
		BotInstance
	}

	private String generateBotId(String gameId){
		return "bot_" + gameId;
	}
}
