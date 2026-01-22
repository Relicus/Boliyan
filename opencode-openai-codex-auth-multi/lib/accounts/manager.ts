import type { Auth, OpencodeClient } from "@opencode-ai/sdk";
import { decodeJWT, refreshAccessToken } from "../auth/auth.js";
import { JWT_CLAIM_PATH, PLUGIN_NAME, PROVIDER_ID } from "../constants.js";
import { logDebug, logWarn } from "../logger.js";
import type {
	AccountSelectionStrategy,
	HealthScoreConfig,
	PluginConfig,
	StoredAccount,
	StoredAccountsFile,
	TokenBucketConfig,
} from "../types.js";
import { loadAccounts, saveAccounts } from "./storage.js";

const ACCOUNT_VERSION = 1;
const RATE_LIMIT_RESET_MS = 120_000;
const RATE_LIMIT_DEDUP_WINDOW_MS = 2000;
const MAX_BACKOFF_MS = 60_000;
const FAILURE_STATE_RESET_MS = 120_000;
const FAILURE_COOLDOWN_MS = 30_000;
const MAX_CONSECUTIVE_FAILURES = 5;

const DEFAULT_HEALTH_SCORE: HealthScoreConfig = {
	initial: 70,
	success_reward: 1,
	rate_limit_penalty: -10,
	failure_penalty: -20,
	recovery_rate_per_hour: 2,
	min_usable: 50,
	max_score: 100,
};

const DEFAULT_TOKEN_BUCKET: TokenBucketConfig = {
	max_tokens: 50,
	regeneration_rate_per_minute: 6,
	initial_tokens: 50,
};

type TokenBucketState = {
	tokens: number;
	lastUpdated: number;
};

type AccountRuntime = StoredAccount & {
	index: number;
	consecutiveRateLimits: number;
	lastRateLimitAt?: number;
	rateLimitUntil?: number;
	consecutiveFailures: number;
	lastFailureAt?: number;
	cooldownUntil?: number;
	healthScore: number;
	tokenBucket: TokenBucketState;
};

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

function resolveHealthConfig(config?: HealthScoreConfig): HealthScoreConfig {
	return { ...DEFAULT_HEALTH_SCORE, ...(config ?? {}) };
}

function resolveTokenBucketConfig(
	config?: TokenBucketConfig,
): TokenBucketConfig {
	return { ...DEFAULT_TOKEN_BUCKET, ...(config ?? {}) };
}

function extractAccountId(accessToken?: string): string | undefined {
	if (!accessToken) {
		return undefined;
	}
	const decoded = decodeJWT(accessToken);
	return decoded?.[JWT_CLAIM_PATH]?.chatgpt_account_id;
}

function buildStoredFromAuth(auth: Auth): StoredAccount | null {
	if (auth.type !== "oauth" || !auth.refresh) {
		return null;
	}
	const now = Date.now();
	return {
		accountId: extractAccountId(auth.access),
		accessToken: auth.access,
		refreshToken: auth.refresh,
		expires: auth.expires,
		addedAt: now,
		lastUsed: now,
	};
}

function upsertAccount(
	accounts: StoredAccount[],
	newAccount: StoredAccount,
): { accounts: StoredAccount[]; index: number } {
	const byAccountId = newAccount.accountId
		? accounts.findIndex((account) => account.accountId === newAccount.accountId)
		: -1;
	const byRefresh = accounts.findIndex(
		(account) => account.refreshToken === newAccount.refreshToken,
	);
	const targetIndex = byAccountId >= 0 ? byAccountId : byRefresh;

	if (targetIndex >= 0) {
		const existing = accounts[targetIndex];
		accounts[targetIndex] = {
			...existing,
			...newAccount,
			addedAt: existing.addedAt,
		};
		return { accounts, index: targetIndex };
	}

	accounts.push(newAccount);
	return { accounts, index: accounts.length - 1 };
}

export async function persistAccountTokens(
	tokens: { access: string; refresh: string; expires: number },
	options: { replaceAll: boolean },
): Promise<void> {
	const accountId = extractAccountId(tokens.access);
	if (!accountId) {
		logWarn("Missing chatgpt_account_id in OAuth token payload");
		return;
	}

	const stored = loadAccounts();
	const accounts = options.replaceAll ? [] : stored?.accounts ? [...stored.accounts] : [];
	const now = Date.now();
	const newAccount: StoredAccount = {
		accountId,
		accessToken: tokens.access,
		refreshToken: tokens.refresh,
		expires: tokens.expires,
		addedAt: now,
		lastUsed: now,
	};
	const { accounts: updated, index } = upsertAccount(accounts, newAccount);

	saveAccounts({
		version: ACCOUNT_VERSION,
		accounts: updated,
		activeIndex: clamp(index, 0, Math.max(updated.length - 1, 0)),
	});
}

export class AccountManager {
	private accounts: AccountRuntime[];
	private activeIndex: number;
	private healthConfig: HealthScoreConfig;
	private tokenConfig: TokenBucketConfig;
	private strategy: AccountSelectionStrategy;
	private pidOffsetEnabled: boolean;
	private switchOnFirstRateLimit: boolean;
	private maxRateLimitWaitSeconds: number;

	private constructor(
		accounts: StoredAccount[],
		activeIndex: number,
		config: PluginConfig,
	) {
		this.healthConfig = resolveHealthConfig(config.health_score);
		this.tokenConfig = resolveTokenBucketConfig(config.token_bucket);
		this.strategy = config.account_selection_strategy ?? "hybrid";
		this.pidOffsetEnabled = config.pid_offset_enabled ?? false;
		this.switchOnFirstRateLimit = config.switch_on_first_rate_limit ?? true;
		this.maxRateLimitWaitSeconds = config.max_rate_limit_wait_seconds ?? 300;
		this.activeIndex = clamp(activeIndex, 0, Math.max(accounts.length - 1, 0));
		const now = Date.now();
		this.accounts = accounts.map((account, index) => ({
			...account,
			index,
			consecutiveRateLimits: 0,
			consecutiveFailures: 0,
			healthScore: this.healthConfig.initial,
			tokenBucket: {
				tokens: this.tokenConfig.initial_tokens,
				lastUpdated: now,
			},
		}));
	}

	static async loadFromDisk(
		auth: Auth,
		config: PluginConfig,
	): Promise<AccountManager> {
		const stored = loadAccounts();
		let accounts = stored?.accounts ? [...stored.accounts] : [];
		let activeIndex = stored?.activeIndex ?? 0;
		let shouldSave = false;

		const authAccount = buildStoredFromAuth(auth);
		if (authAccount) {
			const result = upsertAccount(accounts, authAccount);
			accounts = result.accounts;
			activeIndex = result.index;
			shouldSave = true;
		}

		const manager = new AccountManager(accounts, activeIndex, config);
		if (shouldSave) {
			manager.saveToDisk();
		}

		return manager;
	}

	getAccountCount(): number {
		return this.accounts.length;
	}

	getStrategy(): AccountSelectionStrategy {
		return this.strategy;
	}

	getMaxRateLimitWaitMs(): number {
		return this.maxRateLimitWaitSeconds * 1000;
	}

	getSwitchOnFirstRateLimit(): boolean {
		return this.switchOnFirstRateLimit;
	}

	getMinimumWaitMs(): number | null {
		const now = Date.now();
		const waits = this.accounts
			.map((account) => {
				const rateLimitWait =
					account.rateLimitUntil ? account.rateLimitUntil - now : null;
				const cooldownWait =
					account.cooldownUntil ? account.cooldownUntil - now : null;
				const candidates = [rateLimitWait, cooldownWait].filter(
					(value): value is number => typeof value === "number" && value > 0,
				);
				if (candidates.length === 0) {
					return null;
				}
				return Math.min(...candidates);
			})
			.filter((value): value is number => typeof value === "number" && value > 0);
		if (waits.length === 0) {
			return null;
		}
		return Math.min(...waits);
	}

	getAccountsSnapshot(): StoredAccountsFile {
		return {
			version: ACCOUNT_VERSION,
			accounts: this.accounts.map((account) => ({
				accountId: account.accountId,
				accessToken: account.accessToken,
				refreshToken: account.refreshToken,
				expires: account.expires,
				addedAt: account.addedAt,
				lastUsed: account.lastUsed,
			})),
			activeIndex: this.activeIndex,
		};
	}

	saveToDisk(): void {
		saveAccounts(this.getAccountsSnapshot());
	}

	removeAccount(account: AccountRuntime): void {
		this.accounts = this.accounts.filter((item) => item.index !== account.index);
		this.accounts.forEach((item, index) => {
			item.index = index;
		});
		this.activeIndex = clamp(
			this.activeIndex,
			0,
			Math.max(this.accounts.length - 1, 0),
		);
		this.saveToDisk();
	}

	private resolvePidOffset(): number {
		if (!this.pidOffsetEnabled || this.accounts.length === 0) {
			return 0;
		}
		return process.pid % this.accounts.length;
	}

	private isCoolingDown(account: AccountRuntime, now: number): boolean {
		return typeof account.cooldownUntil === "number" && account.cooldownUntil > now;
	}

	private isRateLimited(account: AccountRuntime, now: number): boolean {
		return typeof account.rateLimitUntil === "number" && account.rateLimitUntil > now;
	}

	private updateTokenBucket(account: AccountRuntime, now: number): void {
		const minutes = (now - account.tokenBucket.lastUpdated) / 60000;
		if (minutes <= 0) {
			return;
		}
		const regenerated = minutes * this.tokenConfig.regeneration_rate_per_minute;
		account.tokenBucket.tokens = Math.min(
			this.tokenConfig.max_tokens,
			account.tokenBucket.tokens + regenerated,
		);
		account.tokenBucket.lastUpdated = now;
	}

	private findAvailableFrom(startIndex: number): AccountRuntime | null {
		const now = Date.now();
		if (this.accounts.length === 0) {
			return null;
		}
		for (let offset = 0; offset < this.accounts.length; offset += 1) {
			const index = (startIndex + offset) % this.accounts.length;
			const account = this.accounts[index];
			if (!account) continue;
			if (this.isRateLimited(account, now) || this.isCoolingDown(account, now)) {
				continue;
			}
			return account;
		}
		return null;
	}

	private selectSticky(): AccountRuntime | null {
		const pidOffset = this.resolvePidOffset();
		const startIndex = (this.activeIndex + pidOffset) % this.accounts.length;
		const account = this.findAvailableFrom(startIndex);
		if (account) {
			this.activeIndex = account.index;
		}
		return account;
	}

	private selectRoundRobin(): AccountRuntime | null {
		const pidOffset = this.resolvePidOffset();
		const startIndex =
			(this.activeIndex + 1 + pidOffset) % this.accounts.length;
		const account = this.findAvailableFrom(startIndex);
		if (account) {
			this.activeIndex = account.index;
		}
		return account;
	}

	private selectHybrid(): AccountRuntime | null {
		const now = Date.now();
		for (const account of this.accounts) {
			this.updateTokenBucket(account, now);
		}

	const available = this.accounts.filter((account) => {
		if (this.isRateLimited(account, now) || this.isCoolingDown(account, now)) {
			return false;
		}
		return account.healthScore >= this.healthConfig.min_usable;
	});

	const eligible = available.length > 0 ? available : this.accounts.filter((account) => {
		return !this.isRateLimited(account, now) && !this.isCoolingDown(account, now);
	});

	if (eligible.length === 0) {
		return null;
	}

	const withTokens = eligible.filter((account) => account.tokenBucket.tokens >= 1);
	const pool = withTokens.length > 0 ? withTokens : eligible;
	pool.sort((a, b) => {
		if (a.healthScore !== b.healthScore) {
			return b.healthScore - a.healthScore;
		}
		const lastA = a.lastUsed ?? 0;
		const lastB = b.lastUsed ?? 0;
		return lastA - lastB;
	});

	const selected = pool[0] ?? null;
	if (selected) {
		this.activeIndex = selected.index;
		if (selected.tokenBucket.tokens >= 1) {
			selected.tokenBucket.tokens -= 1;
		}
	}

	return selected ?? null;
	}

	selectAccount(): AccountRuntime | null {
	if (this.accounts.length === 0) {
		return null;
	}

	let account: AccountRuntime | null = null;
	if (this.strategy === "round-robin") {
		account = this.selectRoundRobin();
	} else if (this.strategy === "sticky") {
		account = this.selectSticky();
	} else {
		account = this.selectHybrid();
	}

	if (account) {
		account.lastUsed = Date.now();
		this.saveToDisk();
	}

	return account;
	}

	markSuccess(account: AccountRuntime): void {
	const now = Date.now();
	account.consecutiveRateLimits = 0;
	account.lastRateLimitAt = undefined;
	account.rateLimitUntil = undefined;
	account.consecutiveFailures = 0;
	account.lastFailureAt = undefined;
	account.cooldownUntil = undefined;
	account.healthScore = clamp(
		account.healthScore + this.healthConfig.success_reward,
		0,
		this.healthConfig.max_score,
	);
	account.lastUsed = now;
	this.saveToDisk();
	}

	markFailure(account: AccountRuntime): void {
	const now = Date.now();
	const previousFailure = account.lastFailureAt;
	const failures =
		previousFailure && now - previousFailure < FAILURE_STATE_RESET_MS
			? account.consecutiveFailures + 1
			: 1;
	account.consecutiveFailures = failures;
	account.lastFailureAt = now;
	account.healthScore = clamp(
		account.healthScore + this.healthConfig.failure_penalty,
		0,
		this.healthConfig.max_score,
	);
	if (failures >= MAX_CONSECUTIVE_FAILURES) {
		account.cooldownUntil = now + FAILURE_COOLDOWN_MS;
	}
	this.saveToDisk();
	}

	markRateLimited(account: AccountRuntime, retryMs: number | null): number {
	const now = Date.now();
	const withinWindow =
		account.lastRateLimitAt && now - account.lastRateLimitAt < RATE_LIMIT_DEDUP_WINDOW_MS;
	const shouldReset =
		!account.lastRateLimitAt || now - account.lastRateLimitAt > RATE_LIMIT_RESET_MS;
	const attempt = shouldReset
		? 1
		: withinWindow
			? account.consecutiveRateLimits
			: account.consecutiveRateLimits + 1;
	account.consecutiveRateLimits = attempt;
	account.lastRateLimitAt = now;
	account.healthScore = clamp(
		account.healthScore + this.healthConfig.rate_limit_penalty,
		0,
		this.healthConfig.max_score,
	);

	const baseDelay = Math.max(retryMs ?? 1000, 1000);
	const backoffDelay = Math.min(baseDelay * Math.pow(2, attempt - 1), MAX_BACKOFF_MS);
	const effectiveDelay = Math.max(baseDelay, backoffDelay);
	account.rateLimitUntil = now + effectiveDelay;
	this.saveToDisk();
	return effectiveDelay;
	}

	async ensureValidToken(
		account: AccountRuntime,
		client: OpencodeClient,
	): Promise<boolean> {
	const now = Date.now();
	if (account.accessToken && account.expires && account.expires > now) {
		return true;
	}
	if (!account.refreshToken) {
		return false;
	}

	const refreshResult = await refreshAccessToken(account.refreshToken);
	if (refreshResult.type === "failed") {
		logWarn("Token refresh failed for account", {
			accountId: account.accountId,
			index: account.index,
		});
		return false;
	}

	account.accessToken = refreshResult.access;
	account.refreshToken = refreshResult.refresh;
	account.expires = refreshResult.expires;
	account.accountId = extractAccountId(refreshResult.access);
	account.lastUsed = now;

	try {
		await client.auth.set({
			path: { id: PROVIDER_ID },
			body: {
				type: "oauth",
				access: refreshResult.access,
				refresh: refreshResult.refresh,
				expires: refreshResult.expires,
			},
		});
	} catch (error) {
		logDebug(`[${PLUGIN_NAME}] Failed to update stored auth`, error);
	}

	this.saveToDisk();
	return !!account.accountId;
	}
}
