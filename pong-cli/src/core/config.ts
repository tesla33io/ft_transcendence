import { existsSync, writeFileSync, readFileSync, mkdirSync } from "fs";
import { join } from "path";
import os from "os";

const configDir = join(process.cwd(), ".pong-cli");
const configPath = join(configDir, "config.json");

export interface AuthConfig {
	id: string;
	name: string;
	jwt: string;
	sessionId: string;
}

export function saveConfig(data: AuthConfig) {
	if (!existsSync(configDir))
			mkdirSync(configDir);

	writeFileSync(configPath, JSON.stringify(data, null, 2));
}

export function loadConfig(): AuthConfig | null {
	if (!existsSync(configPath)) return null;

	try {
		return JSON.parse(readFileSync(configPath, "utf-8"));
	} catch {
		return null;
	}
}

export function clearConfig() {
  if (existsSync(configPath))
	writeFileSync(configPath, "");
}
