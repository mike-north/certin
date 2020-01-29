#!/bin/bash
lerna version prerelease --preid dev --no-commit-hooks --no-push --no-git-tag-version && \
git add -A && \
git commit -m "version bump" --no-verify && \
lerna run changelog && \
git commit --amend -m "version bump" && \
lerna publish from-package