# Tracklister

This utility converts .m3u8, .nml, .csv & .m3u files (exported from Rekordbox, Traktor, 
Serato and Virtual DJ respectively) into readable tracklists.

Additional tools and special filters ensure a consistent and good looking tracklist.

![Preview Image](https://puu.sh/DSdvk/ce9b8aaa6e.png)

## Installers
Windows & MacOS

[Download Tracklister 1.3.4 (MacOS Version coming soon)](https://drive.google.com/open?id=1z6RDijPT1RHMJlgUFxzc1aqc6k5RFk0W)

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
`yarn install`

3. Run the project!
`yarn start`

### Packaging
If you would like to package the program for yourself, you can use [Electron Builder](https://github.com/electron-userland/electron-builder)

1. Install electron-builder globally
`yarn add -g electron-builder`

2. Package the program!
`electron-builder .` or `yarn dist`
