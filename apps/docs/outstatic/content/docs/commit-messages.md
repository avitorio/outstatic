---
title: "Commit Messages"
status: "published"
author:
  name: "Andre Vitorio"
  picture: "https://avatars.githubusercontent.com/u/1417109?v=4"
slug: "commit-messages"
description: "Learn the scoped commit message format Outstatic uses so you can detect content, media, and config changes in Vercel, GitHub Actions, and other deployment tools."
coverImage: ""
publishedAt: "2026-05-11T03:00:00.000Z"
---

Outstatic creates Git commits when content, media, or configuration files are changed from the dashboard.

These commits use a predictable format so they are easy to read in Git history and easy to detect in deployment tools like Vercel or GitHub Actions.

## Format

Outstatic commit messages use this format:

```txt
action status/target "label" [outstatic:scope]
```

Example:

```txt
update draft "Introducing Outstatic" [outstatic:content]
```

The message has two parts:

1. A readable action, such as `update draft "Introducing Outstatic"`
2. An Outstatic metadata tag, such as `[outstatic:content]`

The metadata tag is always at the end of the message.

## Scopes

Outstatic uses three scopes.

| Scope | Meaning |
| --- | --- |
| `[outstatic:content]` | Markdown or MDX content changed |
| `[outstatic:media]` | Media files changed |
| `[outstatic:config]` | Outstatic configuration changed |

## Content Messages

Content messages are used when Markdown or MDX files are created, edited, published, unpublished, or deleted.

### Create draft

```txt
create draft "Post title" [outstatic:content]
```

A new draft was created.

### Update draft

```txt
update draft "Post title" [outstatic:content]
```

An existing draft was edited.

This is useful for deployment automation because draft-only changes often do not need to trigger a production build.

### Update published content

```txt
update published "Post title" [outstatic:content]
```

A published content item was edited.

This usually should trigger a deployment because the public site may need to update.

### Publish content

```txt
publish "Post title" [outstatic:content]
```

A draft was published.

This usually should trigger a deployment because a new page or updated page may need to go live.

### Unpublish content

```txt
unpublish "Post title" [outstatic:content]
```

A published item was unpublished.

This usually should trigger a deployment because the public site may need to remove or hide the page.

### Delete draft

```txt
delete draft "Post title" [outstatic:content]
```

A draft was deleted.

This may not need to trigger a deployment.

### Delete published content

```txt
delete published "Post title" [outstatic:content]
```

A published item was deleted.

This usually should trigger a deployment because the public site may need to remove the page.

## Media Messages

Media messages are used when files such as images are uploaded, changed, or deleted.

### Upload media

```txt
upload media "hero.jpg" [outstatic:media]
```

A media file was uploaded.

This may not need to trigger a deployment by itself. For example, an editor may upload an image first, then link it inside a document in a later save.

### Update media

```txt
update media "hero.jpg" [outstatic:media]
```

A media file was updated or replaced.

Whether this should trigger a deployment depends on how the site serves media.

### Delete media

```txt
delete media "old-image.png" [outstatic:media]
```

A media file was deleted.

Whether this should trigger a deployment depends on whether published pages reference that file.

## Config Messages

Config messages are used when Outstatic configuration changes.

### Update collections

```txt
update collections [outstatic:config]
```

Collection settings changed.

This usually should trigger a deployment because schemas, routes, or generated pages may be affected.

### Update settings

```txt
update settings [outstatic:config]
```

Outstatic settings changed.

Whether this should trigger a deployment depends on the setting.

### Update media index

```txt
update media-index [outstatic:config]
```

The internal `media.json` manifest was rebuilt. This is tagged as `config` rather than `media` because the file is an index, not a user-uploaded asset — sites that read `media.json` at build time should still rebuild on these commits.

---

## Vercel Automation

Vercel automatically builds and deploys commits pushed to the production branch.

When editors make several Outstatic changes in a row, this can create multiple deployments. For example:

1. Upload media
2. Save a draft
3. Link the media inside the document
4. Publish the document

You can use [Vercel's Ignore Build Step](https://vercel.com/kb/guide/how-do-i-use-the-ignored-build-step-field-on-vercel) to skip builds for commits that do not need to deploy.

Vercel exposes the commit message through:

```txt
VERCEL_GIT_COMMIT_MESSAGE
```

### Example: Ignore Draft and Media Changes

This example ignores draft-only content changes and media-only changes.

Create a bash script at the root of your project, it can be something like: `ignore-outstatic-draft.sh`

```bash
#!/bin/bash

COMMIT_MESSAGE="$VERCEL_GIT_COMMIT_MESSAGE"

case "$COMMIT_MESSAGE" in
  *"[outstatic:content]"*)
    if [[ "$COMMIT_MESSAGE" == create\ draft* || "$COMMIT_MESSAGE" == update\ draft* || "$COMMIT_MESSAGE" == delete\ draft* ]]; then
      echo "Ignoring Outstatic draft-only content change"
      exit 0
    fi

    echo "Building Outstatic published content change"
    exit 1
    ;;

  *"[outstatic:media]"*)
    echo "Ignoring Outstatic media-only change"
    exit 0
    ;;

  *)
    echo "Building"
    exit 1
    ;;
esac
```

Then on Vercel, visit Project Settings &gt; Build and Deployment &gt; Ignored Build Step. Select `Run my bash script` and add the command below:

```bash
bash ignore-outstatic-draft.sh
```

In Vercel Ignore Build Step:

- `exit 0` means ignore the build
- `exit 1` means continue with the build

### Example: Only Build Published Content Changes

This example builds only when published content changes, content is published, content is unpublished, published content is deleted, or config changes.

```bash
#!/bin/bash

COMMIT_MESSAGE="$VERCEL_GIT_COMMIT_MESSAGE"

case "$COMMIT_MESSAGE" in
  publish\ *"[outstatic:content]"*)
    echo "Building published content change"
    exit 1
    ;;

  unpublish\ *"[outstatic:content]"*)
    echo "Building unpublished content change"
    exit 1
    ;;

  update\ published\ *"[outstatic:content]"*)
    echo "Building published content update"
    exit 1
    ;;

  delete\ published\ *"[outstatic:content]"*)
    echo "Building published content deletion"
    exit 1
    ;;

  *"[outstatic:config]"*)
    echo "Building Outstatic config change"
    exit 1
    ;;

  *"[outstatic:content]"* | *"[outstatic:media]"*)
    echo "Ignoring Outstatic draft or media-only change"
    exit 0
    ;;

  *)
    echo "Building non-Outstatic commit"
    exit 1
    ;;
esac
```

### Example: GitHub Actions Detection

The same format can be used in GitHub Actions.

```yaml
name: Detect Outstatic Commit

on:
  push:
    branches:
      - main

jobs:
  detect:
    runs-on: ubuntu-latest
    steps:
      - name: Check commit message
        run: |
          COMMIT_MESSAGE="${{ github.event.head_commit.message }}"

          if [[ "$COMMIT_MESSAGE" == *"[outstatic:content]"* ]]; then
            echo "Outstatic content commit"
          elif [[ "$COMMIT_MESSAGE" == *"[outstatic:media]"* ]]; then
            echo "Outstatic media commit"
          elif [[ "$COMMIT_MESSAGE" == *"[outstatic:config]"* ]]; then
            echo "Outstatic config commit"
          else
            echo "Not an Outstatic commit"
          fi
```

## Notes

The Outstatic metadata tag is intentionally placed at the end of the message.

This keeps commit history readable while still allowing scripts to detect Outstatic commits reliably.