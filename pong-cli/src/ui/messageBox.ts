import blessed from "blessed";

export function messageBox(message: string, color: string): Promise<void> {
return new Promise((resolve) => {
	const screen = blessed.screen({ smartCSR: true });

	const box = blessed.box({
	top: "center",
	left: "center",
	width: "50%",
	height: 7,
	border: "line",
	content: `\n${message}\n\nPress any key to continue`,
	tags: true,
	style: {
		border: { fg: color }
	}
	});

	screen.append(box);
	screen.render();

	// any key closes
	screen.key(["escape", "q", "C-c", "enter", "space"], () => {
	screen.destroy();
	resolve();
	});

	screen.on("keypress", () => {
	screen.destroy();
	resolve();
	});
});
}
