# Contributing to Merlin

Thank you for your interest in contributing! This guide explains how to upload or add files to this repository.

---

## How to Upload a File to This Repository

### Option 1 — GitHub Web Interface (no Git required)

1. **Navigate to the repository** on GitHub: `https://github.com/ugobe007/merlin2`
2. **Go to the folder** where you want to add the file (click through the directory tree).
3. Click the **"Add file"** button near the top-right of the file list, then choose **"Upload files"**.
4. **Drag and drop** your file(s) onto the upload area, or click **"choose your files"** to browse your computer.
5. Scroll down to the **"Commit changes"** section:
   - Add a short description of what you are adding.
   - Choose **"Create a new branch"** if you want your change reviewed via a pull request (recommended), or commit directly to `main` if you have permission.
6. Click **"Commit changes"** (or **"Propose changes"** if creating a new branch).
7. If you created a new branch, GitHub will prompt you to open a **Pull Request** — follow the prompts to request a review.

> **Tip:** You can also create a new text/code file directly in the browser by choosing **"Add file → Create new file"** instead of "Upload files".

---

### Option 2 — Git Command Line

If you have [Git](https://git-scm.com/) installed locally:

```bash
# 1. Clone the repository (skip if you already have a local copy)
git clone https://github.com/ugobe007/merlin2.git
cd merlin2

# 2. Create a new branch for your changes
git checkout -b my-feature-branch

# 3. Copy your file into the desired location inside the repo, then stage it
git add path/to/your-file.ext

# 4. Commit the change with a clear message
git commit -m "Add <description of file>"

# 5. Push the branch to GitHub
git push origin my-feature-branch
```

6. Open a **Pull Request** on GitHub from `my-feature-branch` → `main` and request a review.

---

### Option 3 — GitHub CLI

If you have the [GitHub CLI (`gh`)](https://cli.github.com/) installed:

```bash
# Authenticate once
gh auth login

# Clone, add your file, commit, push, and open a PR in one workflow
git clone https://github.com/ugobe007/merlin2.git
cd merlin2
git checkout -b my-feature-branch
cp /path/to/your-file.ext .
git add your-file.ext
git commit -m "Add <description of file>"
git push origin my-feature-branch
gh pr create --title "Add <description>" --body "Brief explanation of the change"
```

---

## General Contribution Guidelines

| Topic | Guideline |
|-------|-----------|
| **Branch naming** | Use descriptive names like `feature/upload-ui` or `fix/calculation-bug` |
| **Commit messages** | Short imperative sentence, e.g. `Add solar pricing table` |
| **Pull Requests** | Always open a PR for review before merging to `main` |
| **File size** | Keep individual files under **10 MB**; use Git LFS for large assets |
| **Secrets** | Never commit API keys, passwords, or `.env` files |
| **Build check** | Run `npm run build` locally before pushing to catch type errors |

---

## Development Setup

```bash
# Install dependencies
npm install

# Start local dev server (default port 5178 — configurable in vite.config.ts)
npm run dev

# Type-check + build
npm run build
```

See [`README.md`](./README.md) for the full project overview and architecture notes.
