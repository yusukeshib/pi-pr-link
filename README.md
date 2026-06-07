# @yusukeshib/pi-pr-link

A [pi](https://pi.dev) extension that shows the GitHub **PR for the current
branch** as a clickable link in the footer status area.

It runs `gh pr view` to resolve the PR for the checked-out branch and pins it
into the footer via `ctx.ui.setStatus()`. The text is an [OSC 8
hyperlink](https://gist.github.com/egmontkob/eb114294efbcd5adb1944c9f3cb5feda),
so it's clickable in terminals that support it.

## What it looks like

When the current branch has an open PR, the footer gains a bold green,
clickable PR number:

```text
#1234
```

Click it (in a supporting terminal) to open the PR in your browser. When there's
no PR — or you're not in a repo, or `gh` isn't installed — the status is simply
hidden.

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
