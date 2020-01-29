#!/bin/bash
lerna version prerelease --preid dev --no-commit-hooks --no-push --no-git-tag-version && \
git add -A && \
lerna run changelog && \
git commit -m "version bump" --no-verify
lerna publish from-package