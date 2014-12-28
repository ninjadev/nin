# nin

> nin is ninjatool

[nin](http://nin.sexy/) is Ninjadev's internal demo tool. It is a tool for easing development of browser-based WebGL demos.

This project has a node backend that keeps track of all files and compiles files as they are edited.
The frontend of this project is written in Angular and displays among other the layers that the demo consists of.

## How it works
Make a folder in `nin` named `test-project`, alongside `dasBoot`. This is now your working directory.
If you want to use a github repo as working directory, clone the repo down first, and rename the folder to `test-project`.

## Setup

You will need to have node and npm installed.

Run `make` in the `frontend` folder and `make` in the `nin` folder.

You will also need to have bower installed, and run `bower install` in the frontend folder.

To use grunt, you need to install the command line utility globally, by running `sudo npm install -g grunt-cli`

### Commands to try if it does not work:

sudo apt-get install g++

## Linting
This projects uses the Google Closure Linter, please see this link for installation information.
`https://developers.google.com/closure/utilities/docs/linter_howto`

## Shaders

Every project has its own shader folder.
This folder has a folder for each shader.
These shaders will be compiled into the global object `SHADERS`, so to access a shader one would write for instance `SHADERS.example`.

If your shader only needs for instance a vertex shader but not a fragment shader NIN will fall back to a default set of shaders.
The only rules you need to oblige is that:
- The uniform file needs to include `tDiffuse`
- The vertex shader needs to pass on vUv (uv)

# Keyboard shortcuts

| key        | function                 |
|------------|--------------------------|
| space      | play/pause               |
| m          | fullscreen               |
| j          | toggle mute music        |
| g          | set/unset loop points    |
| .          | skip one second ahead    |
| ,          | skip one second back     |
| L          | skip ten seconds ahead   |
| K          | skip ten seconds back    |
| return     | rewind to start of demo  |
| >/:        | skip one frame ahead     |
| </;        | skip one frame back      |
| 1          | set playback rate to .25 |
| 2          | set playback rate to .5  |
| 3          | set playback rate to 1   |
| 4          | set playback rate to 2   |
| 5          | set playback rate to 4   |

## Camera controls
See [the wiki page](https://github.com/ninjadev/nin/wiki/Camera-Controller) for more information on the Camera Controller.

| key       | function                      |
|-----------|-------------------------------|
| a/w/s/d   | camera horizontal position    |
| arrows    | camera pitch/yaw              |
| q/e       | camera roll                   |
| r/f       | camera vertical position      |
| p         | log camera position           |
| l         | log camera lookat             |
| x         | reset flight dynamics         |
| c         | toggle fly around mode        |
| z         | decrease camera zoom          |
| Z         | increase camera zoom          |
| mouse click on demo | lookat click target |
