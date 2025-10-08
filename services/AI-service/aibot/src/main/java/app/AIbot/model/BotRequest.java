package app.AIbot.model;

public class BotRequest {
	private String gameId;
	private String difficulty;

	public String getGameId() {return gameId;}
	public String getDifficulty() {return difficulty;}

	public void setGameId(String id){ this.gameId = id;}
	public void setDifficulty(String diff){ this.difficulty = diff;}
}
