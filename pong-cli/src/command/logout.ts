import { messageBox } from "../ui/messageBox";
import { loadConfig } from "../core/config";

export async function logout() {
	const config = loadConfig()
	console.log(`Logout: `, config)
	const res = await fetch("http://localhost:3000/api/v1/auth/logout", {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${config?.sessionId}`
		},
		credentials: 'include',
		body: JSON.stringify({})
	});

	if (!res.ok){
		await messageBox("❌ Logout failed!", "red");
		console.log("Logout failed", res)
		return false
	}

	await messageBox("✔ Logout successful!", "green");
	return true
}
