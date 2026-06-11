# @yusukeshib/pi-pr-link

A [pi](https://pi.dev) extension that shows the GitHub **PR(s) for the current
branch** as clickable links in the footer status area.

If the working directory is a git repo, it runs `gh pr view` to resolve the PR
for the checked-out branch. If it's a *container* directory holding multiple
repos, each immediate child repo is checked and every open PR is shown. Links
are pinned into the footer via `ctx.ui.setStatus()` as [OSC 8
hyperlinks](https://gist.github.com/egmontkob/eb114294efbcd5adb1944c9f3cb5feda),
so they're clickable in terminals that support it.

## What it looks like

When the current branch has an open PR, the footer gains a bold green,
clickable `repo#number` link:

```text
mirage-web#1234
```

In a container directory of multiple repos, one link per repo with an open PR:

```text
mirage-web#1234 mirage-api#56
```

Click a link (in a supporting terminal) to open the PR in your browser. When
there's no PR — or you're not in or above any repo, or `gh` isn't installed —
the status is simply hidden.

## When it refreshes

- on session start
- after every turn (`turn_end`)
- on demand via the `/pr` command

## Requirements

The [GitHub CLI](https://cli.github.com/) (`gh`) must be installed and
authenticated:

```bash
gh auth status   # should show you're logged in
```

## Install

```bash
pi install npm:@yusukeshib/pi-pr-link
```

Via git (no npm publish required):

```bash
pi install git:github.com/yusukeshib/pi-pr-link
```

Try it without installing:

```bash
pi -e npm:@yusukeshib/pi-pr-link
```

## License

MIT
