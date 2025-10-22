package app.AIbot.model.game;

import com.fasterxml.jackson.annotation.JsonProperty;

public class Ball {
	@JsonProperty("x")
	private int x;
	@JsonProperty("y")
	private int y;
	@JsonProperty("vx")
	private int vx;
	@JsonProperty("vy")
	private int vy;

	public void setX(int x){
		this.x = x;
	}
	public void setY(int y){
		this.y = y;
	}
	public void setVx(int vx){
		this.vx = vx;
	}
	public void setVy(int vy){
		this.vy = vy;
	}

	public int getX(){
		return this.x;
	}
	public int getY(){
		return this.y;
	}
	public int getVx(){
		return this.vx;
	}
	public int getVy(){
		return this.vy;
	}
}
