# nin

> nin is ninjatool

This project has a node backend that keeps track of all files and compiles files as they are edited.
The frontend of this project is written in Angular and displays among other the layers that the demo consists of.

## How it works
Make a folder in `nin` named `test-project`, alongside `dasBoot`. This is now your working directory.
If you want to use a github repo as working directory, clone the repo down first, and rename the folder to `test-project`.

## Setup

You will need to have node and npm installed.

Run `make` in the `frontend` folder and `make` in the `nin` folder.

You will also need to have bower installed, and run `bower install` in the frontend folder.

### Commands to try if it does not work:

sudo apt-get install g++
sudo npm install -g grunt-cli

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

| key        | function                |
|------------|-------------------------|
| space      | play/pause              |
| m          | fullscreen              |
|  .         | skip one second ahead   |
|  ,         | skip one second back    |
| return     | rewind to start of demo |
|  >/:       | skip one frame ahead    |
|  </;       | skip one frame back     |

## Camera controls

| key       | function                      |
|-----------|-------------------------------|
| a/w/s/d   | camera horizontal position    |
| arrows    | camera pitch/yaw              |
| q/e       | camera roll                   |
| r/f       | camera vertical position      |
| p         | log camera position           |
| l         | log camera lookat             |
| mouse click on demo | lookat click target |
