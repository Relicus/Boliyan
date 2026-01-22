import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import type { StoredAccountsFile } from "../types.js";

const ACCOUNTS_PATH = join(
	homedir(),
	".opencode",
	"openai-codex-accounts-multi.json",
);

export function getAccountsPath(): string {
	return ACCOUNTS_PATH;
}

export function loadAccounts(): StoredAccountsFile | null {
	if (!existsSync(ACCOUNTS_PATH)) {
		return null;
	}

	try {
		const content = readFileSync(ACCOUNTS_PATH, "utf-8");
		const parsed = JSON.parse(content) as StoredAccountsFile;
		if (!parsed || !Array.isArray(parsed.accounts)) {
			return null;
		}
		return parsed;
	} catch {
		return null;
	}
}

export function saveAccounts(payload: StoredAccountsFile): void {
	const dir = dirname(ACCOUNTS_PATH);
	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true });
	}
	const content = `${JSON.stringify(payload, null, 2)}\n`;
	writeFileSync(ACCOUNTS_PATH, content, "utf-8");
}

export function clearAccounts(): void {
	if (!existsSync(ACCOUNTS_PATH)) {
		return;
	}
	rmSync(ACCOUNTS_PATH, { force: true });
}
