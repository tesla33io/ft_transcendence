import blessed from "blessed"
import { messageBox } from "../ui/messageBox"
import { inputPrompt } from "../ui/inputPromt"
import { saveConfig } from "../core/config"

export async function login(): Promise<boolean> {
	const username = await inputPrompt("Username:")
	const password = await inputPrompt("Password", true)

	const res = await fetch("http://localhost:3000/users/auth/login", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ username: username, password: password }),
	});

	if (!res.ok){
		await messageBox("❌ Login failed! Invalid username or password.", "red");
		return false
	}

	const data = await res.json();
	console.log("Login data", data)
	if (!data.accessToken || !data.refreshToken) {
		await messageBox(`❌ ${data.message}.`, "red");
		return false
	}

	saveConfig({
		id: data.id,
		name: data.username,
		jwt: data.refreshToken,
		sessionId: data.accessToken,
	});

	await messageBox(`✔ ${data.message}.`, "green");
	return true
}
