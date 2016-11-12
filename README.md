# nin

![](http://i.imgur.com/ObCrMxz.jpg)

> nin is ninjatool

nin is Ninjadev's internal demo tool. It is a tool for easing development of browser-based WebGL demos.

This project has a node backend that keeps track of all files and compiles files as they are edited.
The frontend of this project is written in Angular and displays among other the layers that the demo consists of.

## Installing nin

To install nin simply run the command `npm install -g ninjadev-nin`.

## Requirements

This projects requires node version `7.1.0` or newer.

## nin is now node-based!

Nin just became node-based instead of layer-based.
Here is a list of gotchas to watch out for if you are used to layer-based nin:

- Changing res/graph.json does *not* trigger updates in a running nin instance.

## How it works
Create a new project with a structure like the one seen in the directory `example-project`.
It may be stored anywhere on your disk.
In the root folder of your project, execute `nin run`, and visit http://localhost:8000 in your browser to use nin.

### Compiling
The `nin compile` command will create a single file `bin/demo.png.html` that contains all the code and resources of your demo. Base64 and PNG compression magic is used to achieve this. To compile without PNG compression, use `nin compile --no-png-compression`. That will yield a slightly larger file, but more browsers will be able to run it.

### Rendering to video
1. `nin run`.
1. Open nin in your browser, navigate to the frame you want to render from, and press R. This will start dumping single frames as numbered .PNGs in `bin/render/`  in your project folder.
1. Refresh etc every time WebGL crashes.
1. When you have rendered all the frames: `nin render`. You need `ffmpeg` ([ffmpeg.org](http://ffmpeg.org/)) installed for this.
1. The demo is now available at `bin/render/render.mp4`.

Each frame will take up to around 4MB on disk, and the finished .mp4 will be on the order of 1GB when rendered, so make sure you have enough disk space.
Expect to render maybe a frame or two per second.

### Start screen
In the compiled result, you can have a start screen that is shown while the demo is being loaded. When compiling, nin will look for an `index.html` file in the root folder of your demo, and use that as start screen. JavaScript functions `ONPROGRESS` and `ONCOMPLETE` should be implemented in `index.html`. After `ONCOMPLETE` is called, `demo.start()` may be called. `index.html` should not include `</body>` or `</html>`.

## Development Setup

You will need to have node, yarn and webpack installed.
Yarn installation guide is available [here](https://yarnpkg.com/en/docs/install).
If you already have npm installed you can bootstrap to yarn by running `npm install -g yarn`.
Install webpack by running `npm install -g webpack`.

Running `make` in the nin folder will build and compile the entire project.
Running `npm link` will add nin to your node binaries path, making it available globally.

You must have java installed for the `nin compile` command to work.

## Developing

When developing on nin, it can be useful to run the backend and frontend separately.
Instead of executing `nin run` in your project folder, run `nin headless` which will start the backend as usual, but without a frontend connected.
This allows you to serve a development version of the frontend by running `grunt serve` in the frontend folder.

## Linting

The frontend part of this project uses ESLint for linting.
See the `.eslintrc.js` file in the frontend part of this project.

The demo itself and our own `dasBoot` uses the Google Closure Linter, please see this link for installation information.
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

## Testimonials / Reviews

> nice! - [mrdoob](https://twitter.com/mrdoob/status/686575651923574790)

<!-- -->

> Oh man, I didn't know you guys released your tools. I'm a big fan of your stuff -- awesome to see such polished prods on the web. Happy to have helped enable some amazing work! - [daeken](https://news.ycombinator.com/item?id=12264461#unv_12265590)

## Publishing nin

To publish nin type the command `make publish`.
To be able to publish you need access to the `ninjadev` user on npm whose password will be given through secure channels.

## List of known nin projects

- [Ninjacon 2016: Sea Shark Invtro](https://github.com/stianjensen/ninjacon-invite)
- [Everything is Fashion](https://github.com/ninjadev/tyve)
- [Hold Kjæft](https://github.com/Raane/HoldKjeft)
- [Heatseeker](https://github.com/sigvef/heatseeker)
- [Inakuwa Oasis](https://github.com/ninjadev/en)
- [Stars and boxes](https://github.com/iver56/abel-demo-14)
- [Crankwork Steamfist](https://github.com/ninjadev/dix)
