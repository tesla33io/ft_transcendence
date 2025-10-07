package app.controler;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ApiControler {

	@GetMapping("/api/v1/aibot/test")
	public String test(){
		return "Connection reached";
	}

	@GetMapping("/api/v1/aibot/classic")
	public String Aibot (){
		return "Bot connection reached";
	}
}
