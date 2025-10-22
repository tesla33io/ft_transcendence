package app.AIbot;

import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

@Component
public class AIbotManager {
	private static ConcurrentHashMap<String, AIbotInstance> instance = new ConcurrentHashMap<>();

	public synchronized String createBot(String nameSuffix,String gameId, String difficulty){
		final String botId = generateBotId(gameId, nameSuffix);
		AIbot ai = AIbotBuilder.createBot(difficulty);
		AIbotInstance bot = new AIbotInstance(botId, gameId, ai);

		instance.put(botId, bot);

		System.out.println("Created bot: " + botId + " for game: " + gameId);
		return botId;
	}

	public void removeBot(String botId){
		AIbotInstance bot = instance.remove(botId);
		if (bot != null){
			System.out.println("Removed bot: " + botId);
		}
	}

	private String generateBotId(String gameId, String nameSuffix){
		return "bot_" + gameId + nameSuffix;
	}

	public int getNumberOfBots(){
		return instance.size();
	}
}
