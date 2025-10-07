package app.controler;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/aibot")
public class ApiControler {

	@GetMapping("/test")
	public String test(){
		return "Connection reached";
	}

	@GetMapping("/classic") //the request JSON will send the 
	public String Aibot (@RequestBody String rawJson){
		return "Bot connection reached";
	}
}
