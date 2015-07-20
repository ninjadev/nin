# nin

> nin is ninjatool

nin is Ninjadev's internal demo tool. It is a tool for easing development of browser-based WebGL demos.

This project has a node backend that keeps track of all files and compiles files as they are edited.
The frontend of this project is written in Angular and displays among other the layers that the demo consists of.

## How it works
Create a new project with a structure like the one seen in the directory `example-project`.
It may be stored anywhere on your disk.
In the root folder of your project, execute `nin run`, and visit http://localhost:8000 in your browser to use nin.

### Compiling
The `nin compile` command will create a single file `bin/demo.png.html` that contains all the code and resources of your demo. Base64 and PNG compression magic is used to achieve this.

### Rendering to video
1. `nin run`.
1. Open nin in your browser, navigate to the frame you want to render from, and press r. This will start dumping single frames as numbered .PNGs in `bin/render/`  in your project folder.
1. Refresh etc every time WebGL crashes.
1. When you have rendered all the frames: `nin render`. You need `avconv` installed for this.
1. The demo is now available at `bin/render/render.mp4`.

Each frame will take up to around 4MB on disk, and the finished .mp4 will be on the order of 1GB when rendered, so make sure you have enough disk space.
Expect to render maybe a frame or two per second.

### Start screen
In the compiled result, you can have a start screen that is shown while the demo is being loaded. When compiling, nin will look for an `index.html` file in the root folder of your demo, and use that as start screen. JavaScript functions `ONPROGRESS` and `ONCOMPLETE` should be implemented in `index.html`. After `ONCOMPLETE` is called, `demo.start()` may be called. `index.html` should not include `</body>` or `</html>`.

## Setup

You will need to have node, npm and bower installed.

Run `make` in the nin folder. This is a convenience method that runs `make` in the `frontend` and `backend` folders.

To use grunt, you need to install the command line utility globally, by running `sudo npm install -g grunt-cli`

To make nin available as a global command line utility, the easiest way is to add an alias to your `.bashrc` like this:

```
alias nin='~/path/to/nin-project/backend/nin'
```

You must have java installed for the `nin compile` command to work.

### Commands to try if it does not work:

sudo apt-get install g++

## Development

When developing on nin, it can be useful to run the backend and frontend separately.
Instead of executing `nin run` in your project folder, run `nin headless` which will start the backend as usual, but without a frontend connected.
This allows you to serve a development version of the frontend by running `grunt serve` in the frontend folder.

## Linting
This projects uses the Google Closure Linter, please see this link for installation information.
`https://developers.google.com/closure/utilities/docs/linter_howto`  
Use the `--nojsdoc` flag.

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
| +/-        | volume up/down           |
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
| r          | start rendering frames   |

## Camera controls
See [the wiki page](https://github.com/ninjadev/nin/wiki/Camera-Controller) for more information on the Camera Controller.

| key       | function                      |
|-----------|-------------------------------|
| a/w/s/d   | camera horizontal position    |
| arrows    | camera pitch/yaw              |
| q/e       | camera roll                   |
| r/f       | camera vertical position      |
| x         | reset flight dynamics         |
| c         | toggle fly around mode        |
| z         | decrease camera zoom          |
| Z         | increase camera zoom          |
| mouse click on demo | lookat click target |
