import blessed from "blessed";
import { clearConfig } from "../core/config";

export function mainMenu(): Promise<"game" | "profile" | "setting" | "logout"> {
return new Promise((resolve) => {
	const screen = blessed.screen({
		smartCSR: true,
		title: "Main menu"
	});

	const box = blessed.box({
	top: "center",
	left: "center",
	width: "60%",
	height: "60%",
	border: "line",
	label: " Main menu ",
	tags: true,
	style: {
		border: { fg: "cyan" }
	}
	});

	const menu = blessed.list({
	parent: box,
	top: 3,
	left: 2,
	width: "70%",
	height: "60%",
	keys: true,
	mouse: true,
	items: ["Games", "Profile", "Setting", "Logout"],
	style: {
		selected: { bg: "cyan", fg: "black" },
		item: { hoverBg: "cyan" }
	}
	});

	screen.append(box);
	menu.focus();
	screen.render();

	menu.on("select", (_, index) => {
	screen.destroy();

	if (index === 0) resolve("game");
	else if (index === 1) resolve("profile");
	else if (index === 2) resolve("setting");
	else resolve("logout");
	});

	screen.key(["escape", "q", "C-c"], () => {
		screen.destroy();
		clearConfig()
		resolve("logout");
	});
});
}
