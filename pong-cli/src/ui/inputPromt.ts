import blessed from "blessed";

export function inputPrompt(label: string, hidden = false): Promise<string> {
	return new Promise((resolve) => {
		const screen = blessed.screen({
		smartCSR: true,
		title: "Input",
		});

		const form = blessed.form({
		parent: screen,
		keys: true,
		left: "center",
		top: "center",
		width: "50%",
		height: 7,
		border: "line",
		});

		blessed.text({
		parent: form,
		top: 1,
		left: 2,
		content: label,
		});

		const input = blessed.textbox({
		parent: form,
		top: 3,
		left: 2,
		width: "90%",
		keys: true,
		inputOnFocus: true,
		censor: hidden,
		secret: hidden,
		});

		input.focus();
		screen.render();

		input.on("submit", (value) => {
		screen.destroy();
		resolve(value);
		});

		screen.key(["escape", "q", "C-c"], () => {
		screen.destroy();
		resolve("");
		});
	});
}
