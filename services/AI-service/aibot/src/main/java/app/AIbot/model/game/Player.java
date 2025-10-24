package app.AIbot.model.game;

import com.fasterxml.jackson.annotation.JsonProperty;

public class Player {
	private String id;
	private String name;
	private int score;
	@JsonProperty("Y")
	private int Y;
	@JsonProperty("X")
	private int X;
	private boolean ready;

	public void setId(String id){
		this.id = id;
	}
	public void setName(String name){
		this.name = name;
	}

	public void setScore(int score){
		this.score = score;
	}
	public void setY(int Y){
		this.Y = Y;
	}
	public void setX(int X){
		this.X = X;
	}

	public void setReady(boolean ready){
		this.ready = ready;
	}

	public String getId(){
		return this.id;
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
