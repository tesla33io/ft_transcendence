import blessed from "blessed";

export class GameMenu {
	private screen: blessed.Widgets.Screen
	private menu: blessed.Widgets.ListElement

	constructor(){
		this.screen = blessed.screen({
			smartCSR: true,
			title: "Select Game Mode"
		});

		const box = blessed.box({
		top: "center",
		left: "center",
		width: "60%",
		height: "60%",
		border: "line",
		label: " Game Modes ",
		tags: true,
		style: {
			border: { fg: "cyan" }
		}
		});

		this.menu = blessed.list({
		parent: box,
		top: 3,
		left: 2,
		width: "90%",
		height: "80%",
		keys: true,
		items: ["Classic", "Tournament", "AI", "Back"],
		style: {
			selected: { bg: "cyan", fg: "black" },
			item: { hoverBg: "cyan" }
		}
		});

		this.screen.append(box);
		this.menu.focus();
		this.screen.render();

	}

	public show(): Promise<"classic" | "tournament" | "bot-classic" | "back">{
		return new Promise((resolve) => {
			this.menu.on("select", (_, index) => {
			if (index === 0){;
				resolve("classic");
			}
			else if (index === 1){
				resolve("tournament");
			}
			else if (index === 2){
				resolve("bot-classic");
			}
			else{
				resolve("back");
			}
		});

		this.screen.key(["escape", "q", "C-c"], () => {
			resolve("back");
		});
		})
	}

	public destroy(){
		this.screen.destroy()
	}
}
