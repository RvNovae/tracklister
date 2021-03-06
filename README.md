# Tracklister

This utility converts `.m3u8`, `.nml`, `.csv` & `.m3u` files (exported from Rekordbox, Traktor, 
Serato and Virtual DJ respectively) into readable tracklists.
Audio files can now be manually added as well.

Additional tools and special filters ensure a consistent and good looking tracklist.

![Preview Image](https://i.imgur.com/9A2TVMx.png)

## Installers
Windows

[Download Tracklister](https://github.com/RvNovae/tracklister/releases)

## Build it yourself!

### Requirements
Tracklister is based on Electron, so you'll need a few things to get started:

[Node](https://nodejs.org)

[Electron](https://electronjs.org/)

### Installation
To get it running you just have to run a few simple commands:

1. Clone the repository
`git clone git@github.com:RvNovae/tracklister.git`

2. Initialize the project
`npm install`

3. Run the project!
`npm start`

### Packaging
If you would like to package the program for yourself, you can use [Electron Builder](https://github.com/electron-userland/electron-builder)

1. Install electron-builder globally
`npm add -g electron-builder`

2. Package the program!
`electron-builder .` or `npm run dist`
