/**
 * pr-link — shows the GitHub PR(s) for the current branch in the footer.
 *
 * Resolves git repos for the working directory: if cwd is itself a git
 * repo, just that one; otherwise (a "container" directory holding multiple
 * repos) every immediate child directory that is a git repo. For each repo
 * it runs `gh pr view` to find the PR for the checked-out branch and pins
 * clickable `repo#123` links into the footer via ctx.ui.setStatus().
 * The text is an OSC 8 hyperlink, so it's clickable in terminals that
 * support it.
 *
 * Refreshes on session start, after every turn, and via /pr.
 */

import { execFile } from "node:child_process";
import type { Dirent } from "node:fs";
import { readdir } from "node:fs/promises";
import { basename, join } from "node:path";
import { promisify } from "node:util";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const run = promisify(execFile);

// OSC 8 clickable hyperlink: ESC ] 8 ; ; URL BEL  label  ESC ] 8 ; ; BEL
const link = (url: string, label: string) => `\x1b]8;;${url}\x07${label}\x1b]8;;\x07`;

// Bold (1) + underline (4) + green foreground (32), reset (0).
const boldGreen = (s: string) => `\x1b[1;4;32m${s}\x1b[0m`;

interface Pr {
	repo: string;
	url: string;
	number: number;
}

async function isGitRepo(dir: string): Promise<boolean> {
	try {
		await run("git", ["-C", dir, "rev-parse", "--git-dir"], { timeout: 5000 });
		return true;
	} catch {
		return false;
	}
}

/** cwd itself if it's a git repo, otherwise its immediate child repos. */
async function gitRepos(cwd: string): Promise<string[]> {
	if (await isGitRepo(cwd)) return [cwd];
	let entries: Dirent[];
	try {
		entries = await readdir(cwd, { withFileTypes: true });
	} catch {
		return [];
	}
	const dirs = entries
		.filter((e) => e.isDirectory() && !e.name.startsWith("."))
		.map((e) => join(cwd, e.name));
	const flags = await Promise.all(dirs.map(isGitRepo));
	return dirs.filter((_, i) => flags[i]);
}

async function prFor(dir: string): Promise<Pr | null> {
	try {
		const { stdout } = await run("gh", ["pr", "view", "--json", "url,number"], {
			timeout: 5000,
			cwd: dir,
		});
		const { url, number } = JSON.parse(stdout);
		return url ? { repo: basename(dir), url, number } : null;
	} catch {
		return null; // no PR, not a repo, or gh not installed
	}
}

async function prs(cwd: string): Promise<Pr[]> {
	const repos = await gitRepos(cwd);
	const results = await Promise.all(repos.map(prFor));
	return results.filter((pr): pr is Pr => pr !== null);
}

export default function (pi: ExtensionAPI) {
	const refresh = async (ctx: Parameters<Parameters<typeof pi.on>[1]>[1]) => {
		const found = await prs(process.cwd());
		if (found.length > 0) {
			const text = found.map((pr) => link(pr.url, boldGreen(`${pr.repo}#${pr.number}`))).join(" ");
			ctx.ui.setStatus("pr-link", text);
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
