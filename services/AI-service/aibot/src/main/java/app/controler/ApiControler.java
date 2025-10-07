package app.controler;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import app.AIbot.AIbotManager;

@RestController
@RequestMapping("/api/v1/aibot")
public class ApiControler {
	private AIbotManager aIbotManager = new AIbotManager();

	@GetMapping("/test")
	public String test(){
		return "Connection reached";
	}

	@GetMapping("/get-bot/classic") //the request JSON will send the
	public String Aibot (@RequestBody String rawJson){
		final String botId = this.aIbotManager.createBot("id", "easy");
		return botId;
	}
}
