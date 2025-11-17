import blessed from "blessed";
import { clearConfig } from "../core/config";

export class MainMenu{
	private screen: blessed.Widgets.Screen
	private menu: blessed.Widgets.ListElement
	private box: blessed.Widgets.BoxElement

	constructor(){
			this.screen = blessed.screen({
				smartCSR: true,
				title: "Select Game Mode"
			});

			this.box = blessed.box({
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
			parent: this.box,
			top: 3,
			left: 2,
			width: "90%",
			height: "80%",
			keys: true,
			items: ["Game", "Profile", "Setting", "Logout"],
			style: {
				selected: { bg: "cyan", fg: "black" },
				item: { hoverBg: "cyan" }
			}
			});

			this.screen.append(this.box);
			this.menu.focus();
			this.screen.render();

		}

		public show(): Promise<"game" | "profile" | "setting" | "logout">{
			return new Promise((resolve) => {
				this.menu.on("select", (_, index) => {
				this.screen.destroy()
				if (index === 0){;
					resolve("game");
				}
				else if (index === 1){
					resolve("profile");
				}
				else if (index === 2){
					resolve("setting");
				}
				else resolve("logout");
			});

			this.screen.key(["escape", "q", "C-c"], () => {
				resolve("logout");
			});
			})
		}

	public destroy(){
		this.screen.destroy()
	}

	public rerender(){
		this.screen.render()
	}

	public hide(){
		this.menu.hide()
	}

	public focus(){
		this.menu.focus()
	}

}
