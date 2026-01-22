import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { PLUGIN_NAME } from "./constants.js";
import type { PluginConfig } from "./types.js";

const CONFIG_PATH = join(
	homedir(),
	".opencode",
	"openai-codex-auth-multi-config.json",
);

/**
 * Default plugin configuration
 * CODEX_MODE is enabled by default for better Codex CLI parity
 */
const DEFAULT_CONFIG: PluginConfig = {
	codexMode: true,
	account_selection_strategy: "hybrid",
	switch_on_first_rate_limit: true,
	pid_offset_enabled: false,
	max_rate_limit_wait_seconds: 300,
	health_score: {
		initial: 70,
		success_reward: 1,
		rate_limit_penalty: -10,
		failure_penalty: -20,
		recovery_rate_per_hour: 2,
		min_usable: 50,
		max_score: 100,
	},
	token_bucket: {
		max_tokens: 50,
		regeneration_rate_per_minute: 6,
		initial_tokens: 50,
	},
};

/**
 * Load plugin configuration from ~/.opencode/openai-codex-auth-multi-config.json
 * Falls back to defaults if file doesn't exist or is invalid
 *
 * @returns Plugin configuration
 */
export function loadPluginConfig(): PluginConfig {
	try {
		if (!existsSync(CONFIG_PATH)) {
			return DEFAULT_CONFIG;
		}

		const fileContent = readFileSync(CONFIG_PATH, "utf-8");
		const userConfig = JSON.parse(fileContent) as Partial<PluginConfig>;

		// Merge with defaults
		return {
			...DEFAULT_CONFIG,
			...userConfig,
		};
	} catch (error) {
		console.warn(
			`[${PLUGIN_NAME}] Failed to load config from ${CONFIG_PATH}:`,
			(error as Error).message,
		);
		return DEFAULT_CONFIG;
	}
}

/**
 * Get the effective CODEX_MODE setting
 * Priority: environment variable > config file > default (true)
 *
 * @param pluginConfig - Plugin configuration from file
 * @returns True if CODEX_MODE should be enabled
 */
export function getCodexMode(pluginConfig: PluginConfig): boolean {
	// Environment variable takes precedence
	if (process.env.CODEX_MODE !== undefined) {
		return process.env.CODEX_MODE === "1";
	}

	// Use config setting (defaults to true)
	return pluginConfig.codexMode ?? true;
}
