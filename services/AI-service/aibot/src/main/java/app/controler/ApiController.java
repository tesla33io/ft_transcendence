package app.controler;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.http.ResponseEntity;


import app.AIbot.AIbotManager;
import app.AIbot.model.BotRequest;


@RestController
@RequestMapping("/api/v1/aibot")
public class ApiController {
	private AIbotManager aIbotManager = new AIbotManager();

	@GetMapping("/test")
	public String test(){
		return "Connection reached\n";
	}

	@GetMapping("/numbers-of-bots")
	public String getNumberOfBots(){
		final int n = this.aIbotManager.getNumberOfBots();
		return "Current numbers of bots are: [" + n + "]\n";
	}

	@PostMapping("/get-bot/classic") //the request JSON will send the
	public ResponseEntity<BotResponse> Aibot (@RequestBody BotRequest req){
		final String botId = this.aIbotManager.createBot(req.getNameSuffix(), req.getGameId(), req.getDifficulty());
		BotResponse response = new BotResponse(botId);
		return ResponseEntity.ok(response);
	}

	@PostMapping("/delete-bot")
	public String deleteBot(@RequestBody String botId) {
		this.aIbotManager.removeBot(botId);
		return "Deleted bot: " + botId;
	}


	public static class BotResponse {
		private String botId;

		public BotResponse() {} // Default constructor for JSON deserialization

		public BotResponse(String botId) {
			this.botId = botId;
		}

		public String getBotId() {
			return botId;
		}

		public void setBotId(String botId) {
			this.botId = botId;
		}
}
}
