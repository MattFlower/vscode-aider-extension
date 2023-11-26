# VSCode-Aider-Extension

![Example](https://raw.githubusercontent.com/mattflower/vscode-aider-extension/master/media/Example.png)

## Introduction

Aider's website describes the tool best:

> [Aider](https://aider.chat) is a command line tool that allows you to pair program with GPT-3.5/GPT 4.0.  You can start a new project or work with an existing repo.  Aider makes sure edits from GPT are [committed to git](https://aider.chat/docs/faq.html#how-does-aider-use-git) with sensible commit messages.  Aider is unique in that it lets you ask for changes to [pre-existing, larger codebases](https://aider.chat/docs/repomap.html).

As a frequent user of Aider, I was looking for a way to accomplish three goals:

1. With the aider tool, you have to tell it what files it should be considering in your current chat session.  Much like the [wonderful plugin for Neovim](https://github.com/joshuavial/aider.nvim), I found it a mild chore to keep running `/add filename` and `/drop filename` and thought maybe I could make an extension that automates away those chores.
2. Aider (like all ChatGPT tools) requires you to supply your OPENAI_API_KEY prior to calling API endpoints.  Aider needs this as well.  I wanted to be able to set this automatically.
3. I wanted the tool to feel naturally like part of VSCode.

## What Works, What Still Needs Some Iteration

I'm really new at writing VSCode plugins.  Given that I like Aider, it might not surprise you that I ran:

> Write a vscode extension for running aider.  The extension should keep track of open files, it should run \add and \drop to keep the commands inside of the tool synchronized with the open file list inside of vscode.

This command created about 70% of V1 of this plugin.  Alas, there are some things are not quite right yet.  

1. This plugin does a poor job at dealing with multiple open folders in the workspace.  I'm aware of it, but it's going to require some surgery to fix.  Right now, I just assume workspace[0] is your workspace.
2. When the plugin first opens, it should be automatically adding any currently open files to Aider.  For whatever reason, the command I'm using `vscode.workspace.textDocuments` doesn't seem to return all the tabs I have open all of the time.  I've also tried `vscode.window.visibleTextEditors`, it also refused to return all the open tabs all of the time.  This mostly seems to happen when I've first starting up vscode and it's using previously saved tabs.  
3. For reasons that I don't fully understand, VSCode doesn't provide a way to read stdout of a terminal.  I would much prefer to read the "Git working dir" from that stdout.  Without it, I look for .git projects at or above the workspace[0] dir.  If that doesn't work, I look for the first parent directory of the current file until I find a .git dir.  This has worked for me so far, but I'd really prefer if there were a way to read stdout.  Supposedly it's coming in a future version of vscode.
4. The Python plugin has a default setting that always activates the current python environment for every new terminal.  This includes the terminal I create for aider.  I wouldn't mind, except it pollutes the output of aider.  The only solution I have so far is to turn off the property "Terminal: Activate Environment" in the Python settings.  Keep in mind, you'll need to source your venvs yourself if you turn this off.

## Setting up the plugin

I would suggest doing three things:

1. Open the Aider settings and set OPENAI_API_KEY.
2. If you have trouble running Aider because it can't find the aider executable, you may need to set the full path to the executable in the "Command Line" setting for Aider.  For example, you may need to set it to something like `/opt/homebrew/bin/aider`.
3. If you want to use GPT 4.5 Turbo, you'll probably have to update the command line further, to something like `aider --model gpt-4-1106-preview`

## Using the plugin

Run the "Aider Open" command from your Command Palette to start the plugin.
