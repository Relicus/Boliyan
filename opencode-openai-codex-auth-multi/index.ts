/**
 * OpenAI ChatGPT (Codex) OAuth Authentication Plugin for opencode
 *
 * COMPLIANCE NOTICE:
 * This plugin uses OpenAI's official OAuth authentication flow (the same method
 * used by OpenAI's official Codex CLI at https://github.com/openai/codex).
 *
 * INTENDED USE: Personal development and coding assistance with your own
 * ChatGPT Plus/Pro subscription.
 *
 * NOT INTENDED FOR: Commercial resale, multi-user services, high-volume
 * automated extraction, or any use that violates OpenAI's Terms of Service.
 *
 * Users are responsible for ensuring their usage complies with:
 * - OpenAI Terms of Use: https://openai.com/policies/terms-of-use/
 * - OpenAI Usage Policies: https://openai.com/policies/usage-policies/
 *
 * For production applications, use the OpenAI Platform API: https://platform.openai.com/
 *
 * @license MIT with Usage Disclaimer (see LICENSE file)
 * @author numman-ali
 * @repository https://github.com/numman-ali/opencode-openai-codex-auth-multi
 */

import type { Plugin, PluginInput } from "@opencode-ai/plugin";
import type { Auth } from "@opencode-ai/sdk";
import { AccountManager, persistAccountTokens } from "./lib/accounts/manager.js";
import { promptLoginMode } from "./lib/accounts/prompt.js";
import { loadAccounts } from "./lib/accounts/storage.js";
import {
	createAuthorizationFlow,
	exchangeAuthorizationCode,
	parseAuthorizationInput,
	REDIRECT_URI,
} from "./lib/auth/auth.js";
import { openBrowserUrl } from "./lib/auth/browser.js";
import { startLocalOAuthServer } from "./lib/auth/server.js";
import { getCodexMode, loadPluginConfig } from "./lib/config.js";
import {
	AUTH_LABELS,
	CODEX_BASE_URL,
	DUMMY_API_KEY,
	HTTP_STATUS,
	LOG_STAGES,
	PLUGIN_NAME,
	PROVIDER_ID,
} from "./lib/constants.js";
import { logRequest, logDebug } from "./lib/logger.js";
import {
	createCodexHeaders,
	extractRequestUrl,
	handleErrorResponse,
	handleSuccessResponse,
	rewriteUrlForCodex,
	transformRequestForCodex,
} from "./lib/request/fetch-helpers.js";
import type { UserConfig } from "./lib/types.js";

const FIRST_RETRY_DELAY_MS = 1000;

function retryAfterMsFromResponse(response: Response): number | null {
	const retryAfterMsHeader = response.headers.get("retry-after-ms");
	if (retryAfterMsHeader) {
		const parsed = Number.parseInt(retryAfterMsHeader, 10);
		if (!Number.isNaN(parsed) && parsed > 0) {
			return parsed;
		}
	}

	const retryAfterHeader = response.headers.get("retry-after");
	if (retryAfterHeader) {
		const parsed = Number.parseInt(retryAfterHeader, 10);
		if (!Number.isNaN(parsed) && parsed > 0) {
			return parsed * 1000;
		}
	}

	return null;
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * OpenAI Codex OAuth authentication plugin for opencode
 *
 * This plugin enables opencode to use OpenAI's Codex backend via ChatGPT Plus/Pro
 * OAuth authentication, allowing users to leverage their ChatGPT subscription
 * instead of OpenAI Platform API credits.
 *
 * @example
 * ```json
 * {
 *   "plugin": ["opencode-openai-codex-auth-multi"],
 *   "model": "openai/gpt-5-codex"
 * }
 * ```
 */
export const OpenAIAuthPlugin: Plugin = async ({ client }: PluginInput) => {
	const resolveLoginMode = async (): Promise<{ replaceAll: boolean }> => {
		const existingCount = loadAccounts()?.accounts?.length ?? 0;
		const mode = await promptLoginMode(existingCount);
		return { replaceAll: mode === "fresh" };
	};

	const buildManualOAuthFlow = (
		pkce: { verifier: string },
		url: string,
		replaceAll: boolean,
	) => ({
		url,
		method: "code" as const,
		instructions: AUTH_LABELS.INSTRUCTIONS_MANUAL,
		callback: async (input: string) => {
			const parsed = parseAuthorizationInput(input);
			if (!parsed.code) {
				return { type: "failed" as const };
			}
			const tokens = await exchangeAuthorizationCode(
				parsed.code,
				pkce.verifier,
				REDIRECT_URI,
			);
			if (tokens?.type === "success") {
				await persistAccountTokens(tokens, { replaceAll });
				return tokens;
			}
			return { type: "failed" as const };
		},
	});
	return {
		auth: {
			provider: PROVIDER_ID,
			/**
			 * Loader function that configures OAuth authentication and request handling
			 *
			 * This function:
			 * 1. Validates OAuth authentication
			 * 2. Extracts ChatGPT account ID from access token
			 * 3. Loads user configuration from opencode.json
			 * 4. Fetches Codex system instructions from GitHub (cached)
			 * 5. Returns SDK configuration with custom fetch implementation
			 *
			 * @param getAuth - Function to retrieve current auth state
			 * @param provider - Provider configuration from opencode.json
			 * @returns SDK configuration object or empty object for non-OAuth auth
			 */
			async loader(getAuth: () => Promise<Auth>, provider: unknown) {
				const auth = await getAuth();

				// Only handle OAuth auth type, skip API key auth
				if (auth.type !== "oauth") {
					return {};
				}
				// Extract user configuration (global + per-model options)
				const providerConfig = provider as
					| { options?: Record<string, unknown>; models?: UserConfig["models"] }
					| undefined;
				const userConfig: UserConfig = {
					global: providerConfig?.options || {},
					models: providerConfig?.models || {},
				};

				// Load plugin configuration and determine CODEX_MODE
				// Priority: CODEX_MODE env var > config file > default (true)
				const pluginConfig = loadPluginConfig();
				const codexMode = getCodexMode(pluginConfig);
				const accountManager = await AccountManager.loadFromDisk(
					auth,
					pluginConfig,
				);
				if (accountManager.getAccountCount() === 0) {
					logDebug(
						`[${PLUGIN_NAME}] No OAuth accounts found. Run opencode auth login.`,
					);
					return {};
				}

				// Return SDK configuration
				return {
					apiKey: DUMMY_API_KEY,
					baseURL: CODEX_BASE_URL,
					/**
					 * Custom fetch implementation for Codex API
					 *
					 * Handles:
					 * - Token refresh when expired
					 * - URL rewriting for Codex backend
					 * - Request body transformation
					 * - OAuth header injection
					 * - SSE to JSON conversion for non-tool requests
					 * - Error handling and logging
					 *
					 * @param input - Request URL or Request object
					 * @param init - Request options
					 * @returns Response from Codex API
					 */
					async fetch(
						input: Request | string | URL,
						init?: RequestInit,
					): Promise<Response> {
						// Step 1: Extract and rewrite URL for Codex backend
						const originalUrl = extractRequestUrl(input);
						const url = rewriteUrlForCodex(originalUrl);

						// Step 2: Transform request body with model-specific Codex instructions
						const originalBody = init?.body ? JSON.parse(init.body as string) : {};
						const isStreaming = originalBody.stream === true;

						const transformation = await transformRequestForCodex(
							init,
							url,
							userConfig,
							codexMode,
						);
						const requestInit = transformation?.updatedInit ?? init;
						const model = transformation?.body.model;
						const promptCacheKey = (transformation?.body as any)?.prompt_cache_key;

						while (true) {
							const accountCount = accountManager.getAccountCount();
							if (accountCount === 0) {
								throw new Error(
									"No OAuth accounts configured. Run `opencode auth login`.",
								);
							}

							const account = accountManager.selectAccount();
							if (!account) {
								const waitMs = accountManager.getMinimumWaitMs() ?? 60_000;
								const maxWaitMs = accountManager.getMaxRateLimitWaitMs();
								if (maxWaitMs > 0 && waitMs > maxWaitMs) {
									throw new Error(
										`All ${accountCount} account(s) rate-limited. Try again later or add another account.`,
									);
								}
								await sleep(waitMs);
								continue;
							}

							const tokenReady = await accountManager.ensureValidToken(
								account,
								client,
							);
							if (!tokenReady || !account.accountId) {
								accountManager.markFailure(account);
								if (!account.accountId) {
									accountManager.removeAccount(account);
								}
								continue;
							}

							const accessToken = account.accessToken ?? "";
							const headers = createCodexHeaders(
								requestInit,
								account.accountId,
								accessToken,
								{ model, promptCacheKey },
							);

							const response = await fetch(url, {
								...requestInit,
								headers,
							});

							logRequest(LOG_STAGES.RESPONSE, {
								status: response.status,
								ok: response.ok,
								statusText: response.statusText,
								headers: Object.fromEntries(response.headers.entries()),
							});

							if (response.status === HTTP_STATUS.UNAUTHORIZED) {
								const refreshed = await accountManager.ensureValidToken(
									account,
									client,
								);
								if (!refreshed) {
									accountManager.markFailure(account);
								}
								continue;
							}

							if (!response.ok) {
								const errorResponse = await handleErrorResponse(response);
								if (
									errorResponse.status === HTTP_STATUS.TOO_MANY_REQUESTS
								) {
									const retryAfterMs = retryAfterMsFromResponse(errorResponse);
									const delayMs = accountManager.markRateLimited(
										account,
										retryAfterMs,
									);

									if (
										accountManager.getSwitchOnFirstRateLimit() &&
										accountManager.getAccountCount() > 1
									) {
										await sleep(FIRST_RETRY_DELAY_MS);
										continue;
									}

									await sleep(delayMs);
									continue;
								}

								accountManager.markFailure(account);
								return errorResponse;
							}

							accountManager.markSuccess(account);
							return await handleSuccessResponse(response, isStreaming);
						}
					},
				};
			},
				methods: [
					{
						label: AUTH_LABELS.OAUTH,
						type: "oauth" as const,
					/**
					 * OAuth authorization flow
					 *
					 * Steps:
					 * 1. Generate PKCE challenge and state for security
					 * 2. Start local OAuth callback server on port 1455
					 * 3. Open browser to OpenAI authorization page
					 * 4. Wait for user to complete login
					 * 5. Exchange authorization code for tokens
					 *
					 * @returns Authorization flow configuration
					 */
						authorize: async () => {
							const { replaceAll } = await resolveLoginMode();
							const { pkce, state, url } = await createAuthorizationFlow();
							const serverInfo = await startLocalOAuthServer({ state });

							// Attempt to open browser automatically
							openBrowserUrl(url);

							if (!serverInfo.ready) {
								serverInfo.close();
								return buildManualOAuthFlow(pkce, url, replaceAll);
							}

							return {
								url,
								method: "auto" as const,
								instructions: AUTH_LABELS.INSTRUCTIONS,
								callback: async () => {
									const result = await serverInfo.waitForCode(state);
									serverInfo.close();

									if (!result) {
										return { type: "failed" as const };
									}

									const tokens = await exchangeAuthorizationCode(
										result.code,
										pkce.verifier,
										REDIRECT_URI,
									);

									if (tokens?.type === "success") {
										await persistAccountTokens(tokens, { replaceAll });
										return tokens;
									}

									return { type: "failed" as const };
								},
							};
						},
					},
					{
						label: AUTH_LABELS.OAUTH_MANUAL,
						type: "oauth" as const,
						authorize: async () => {
							const { replaceAll } = await resolveLoginMode();
							const { pkce, url } = await createAuthorizationFlow();
							return buildManualOAuthFlow(pkce, url, replaceAll);
						},
					},
					{
						label: AUTH_LABELS.API_KEY,
						type: "api" as const,
					},
			],
		},
	};
};

export default OpenAIAuthPlugin;
