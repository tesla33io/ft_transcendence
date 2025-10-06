package app.controler;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ApiControler {

	@GetMapping("/test")
	public String test(){
		return "Test";
	}
}
