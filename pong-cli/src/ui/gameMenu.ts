import blessed from "blessed";

export function gameMenu(): Promise<"classic" | "tournament" | "bot-classic" | "back"> {
return new Promise((resolve) => {
	const screen = blessed.screen({
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

	const menu = blessed.list({
	parent: box,
	top: 3,
	left: 2,
	width: "90%",
	height: "80%",
	keys: true,
	mouse: true,
	items: ["Classic", "Tournament", "AI", "Back"],
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
		if (index === 0) resolve("classic");
		else if (index === 1) resolve("tournament");
		else if (index === 2) resolve("bot-classic");
		else resolve("back");
	});

	screen.key(["escape", "q", "C-c"], () => {
	screen.destroy();
	resolve("back");
	});
});
}
