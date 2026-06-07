/**
 * pr-link — shows the GitHub PR for the current branch in the footer.
 *
 * Uses `gh pr view` to resolve the PR URL for the checked-out branch and
 * pins it into the footer status area via ctx.ui.setStatus(). The text is
 * an OSC 8 hyperlink, so it's clickable in terminals that support it.
 *
 * Refreshes on session start, after every turn, and via /pr.
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const run = promisify(execFile);

// OSC 8 clickable hyperlink: ESC ] 8 ; ; URL BEL  label  ESC ] 8 ; ; BEL
const link = (url: string, label: string) => `\x1b]8;;${url}\x07${label}\x1b]8;;\x07`;

// Bold (1) + underline (4) + green foreground (32), reset (0).
const boldGreen = (s: string) => `\x1b[1;4;32m${s}\x1b[0m`;

async function prUrl(): Promise<{ url: string; number: number } | null> {
	try {
		const { stdout } = await run("gh", ["pr", "view", "--json", "url,number"], {
			timeout: 5000,
		});
		const { url, number } = JSON.parse(stdout);
		return url ? { url, number } : null;
	} catch {
		return null; // no PR, not a repo, or gh not installed
	}
}

export default function (pi: ExtensionAPI) {
	const refresh = async (ctx: Parameters<Parameters<typeof pi.on>[1]>[1]) => {
		const pr = await prUrl();
		if (pr) {
			ctx.ui.setStatus("pr-link", link(pr.url, boldGreen(`#${pr.number}`)));
		} else {
			ctx.ui.setStatus("pr-link", undefined);
		}
	};

	pi.on("session_start", async (_e, ctx) => refresh(ctx));
	pi.on("turn_end", async (_e, ctx) => refresh(ctx));

	pi.registerCommand("pr", {
		description: "Refresh the PR link in the footer",
		handler: async (_args, ctx) => {
			await refresh(ctx);
			ctx.ui.notify("PR link refreshed", "info");
		},
	});
}
