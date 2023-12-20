# ChangeLog

All notable changes to this project will be documented in this file.

The format is based on [Keep a ChangeLog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.9] - 2023-12-19

- Added "Aider Debug Info" command to output some debug info that I can use to debug problems people are experiencing.
- Fixed an error in 'Open Aider' command which didn't clear out the known files, which may have resulted in files not being added for some if they had previously closed the Aider terminal.


## [0.0.8] - 2023-11-28

- Fixed defect #1, but that unfortunately exposed other Windows defects.  So, windows doesn't really work.
- Add unit tests.
- Created an icon for AiderExtension (thanks, ChatGPT and Dall-E)
- Combine adds (or drops) into a single line

## [0.0.7] - 2023-11-26

- Introduce a ChangeLog
- Fix startup when you have multiple top-level folders in your workspace.  Now you'll be asked explicitly which one to use.  
- Introduce a configuration object for the working directory so it can be set manually, this is intended to be used with workspace settings as opposed to user settings.
- Explicitly set the current working directory.
- Introduce error messages when you try to run a command that won't work before you've opened aider.
- Internal refactoring to make things a little bit more readable.

## [0.0.6] - 2023-11-25

- Quick fix due to README.md being in the wrong directory, preventing the extension page from having some description.

## [0.0.5] - 2023-11-25

- Initial release to the VSCode Marketplace.
- Basic functionality is in place and the extension appears to work.
