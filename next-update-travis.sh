#!/bin/bash

set -e

if [ "$TRAVIS_EVENT_TYPE" = "cron" ]; then
  if [ "$GH_TOKEN" = "" ]; then
    echo ""
    echo "⛔️ Cannot find environment variable GH_TOKEN ⛔️"
    echo "Please set it up for this script to be able"
    echo "to push results to GitHub"
    echo "ℹ️ The best way is to use semantic-release to set it up"
    echo ""
    echo "  https://github.com/semantic-release/semantic-release"
    echo ""
    echo "npm i -g semantic-release-cli"
    echo "semantic-release-cli setup"
    echo ""
    exit 1
  fi

  echo "Upgrading dependencies using next-update"
  npm i -g next-update

  # you can edit options to allow only some updates
  # --allow major | minor | patch
  # --latest true | false
  # see all options by installing next-update
  # and running next-update -h
  next-update --allow minor --latest false

  git status
  # if package.json is modified we have
  # new upgrades
  if git diff --name-only | grep package.json > /dev/null; then
    echo "There are new versions of dependencies 💪"
    git add package.json
    echo "----------- package.json diff -------------"
    git diff --staged
    echo "-------------------------------------------"
    git config --global user.email "next-update@ci.com"
    git config --global user.name "next-update"
    git commit -m "chore(deps): upgrade dependencies using next-update"
    # push back to GitHub using token
    git remote remove origin
    # TODO read origin from package.json
    # or use github api module github
    # like in https://github.com/semantic-release/semantic-release/blob/caribou/src/post.js
    git remote add origin https://next-update:$GH_TOKEN@github.com/bahmutov/dont-break.git
    git push origin HEAD:master
  else
    echo "No new versions found ✋"
  fi
else
  echo "Not a cron job, normal test"
fi
