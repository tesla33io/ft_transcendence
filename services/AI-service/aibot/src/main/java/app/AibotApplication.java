package app;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;


@SpringBootApplication
public class AibotApplication {

	public static void main(String[] args) {
		SpringApplication.run(AibotApplication.class, args);
	}

}

// @RestController
// class InnerAibotApplication {

// 	@GetMapping("/test")
// 	public String test(){
// 		return "test";
// 	}
// }
