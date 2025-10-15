package app.AIbot.model.game;

public class Player {
	private String Id;
	private String name;
	private int score;
	private int Y;
	private int X;
	private boolean ready;

	public String getId(){
		return this.Id;
	}

	public String getName(){
		return this.name;
	}

	public int getScore(){
		return this.score;
	}

	public int getY(){
		return this.Y;
	}

	public int getX(){
		return this.X;
	}

	public boolean getReady(){
		return this.ready;
	}
}
