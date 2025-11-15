import { loadConfig } from "./config.js";

export async function api(url: string, options: RequestInit = {}) {
const auth = loadConfig();

let headers = {
	"Content-Type": "application/json",
	...(options.headers || {}),
};

if (auth?.jwt) {
	headers["Authorization"] = `Bearer ${auth.jwt}`;
}
if (auth?.sessionId) {
	headers["X-Session-Id"] = auth.sessionId;
}

return fetch(url, { ...options, headers });
}
