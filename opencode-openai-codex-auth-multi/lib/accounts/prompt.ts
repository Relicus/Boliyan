type LoginMode = "add" | "fresh";

export async function promptLoginMode(existingCount: number): Promise<LoginMode> {
	if (existingCount <= 0) {
		return "add";
	}

	const { createInterface } = await import("node:readline/promises");
	const { stdin, stdout } = await import("node:process");
	const rl = createInterface({ input: stdin, output: stdout });

	try {
		const answer = (await rl.question(
			`${existingCount} account(s) saved. (a)dd new account(s) or (f)resh start? [a/f]: `,
		)).trim().toLowerCase();
		if (answer.startsWith("f")) {
			return "fresh";
		}
		return "add";
	} finally {
		rl.close();
	}
}

export type { LoginMode };
