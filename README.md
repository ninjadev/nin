# nin

*DISCLAIMER*: This is a tool created for internal use by Ninjadev, and is open sourced to share ideas with and get feedback from the community.
You are free to use it, according to the License, but we will not necessarily provide support and may at any time add, change or remove features as we require for our productions.

![](https://github.com/ninjadev/nin/raw/master/nin-preview.PNG)

> nin is ninjatool

nin is Ninjadev's internal demo tool.
It is a tool for easing development of browser-based WebGL demos.
Core features include:

- Node-based demotool, effortlessly reuse your effects, scenes, and create crazy transitions.
- Livereloading of shaders and scenes in the browser. No more manual recompilation!
- Tight THREE.js integration for all your WebGL needs.
- Compile and pack your WebGL demo to a .png.html file for easy compo delivery

The backend component is written in node.js, and keeps track of and recompiles changed files.
The frontend is created using React, and communicates with the backend over websockets.

# User manual

## Installing nin

To install nin simply run the command `npm install -g ninjadev-nin`.
This projects requires node version `7.9.0` or newer.
You can install node from packaging [here](https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions) or download zipped source from [this page](https://nodejs.org/en/download/current/) and verify signatures with the guide [here](https://github.com/nodejs/node/#verifying-binaries);

You will also need `git` installed for project generation to work.
New project created with nin get a default .eslintrc suitable for WebGL demos with THREE.js.

## Getting started

Running `nin new <dirname>` will create the specified directory and initialize a new nin project inside.
Running `nin run` inside the newly created project will make it accessible on http://localhost:8000.

nin creates a manifest file called `nin.json`.
You should fill out this file with the title of your demo, the authors, a description, song metadata, and even a google analytics tracking code to collect statistics.
The metadata is then used to generate html meta-tags in the head of the demo,
as well as in the metadata segment of the `.png.html` file.
The png metadata can be viewed with a command such as `pngcheck -c -t -7 bin/demo.png.html` on linux.

## My First Node

Create a new node by clicking `Generate -> THREE NODE` in the frontend menu.
The node will be placed in `src/nodeName.js` and added to the graph in `res/graph.json`.
You must connect the node yourself to the output node.
This is done by setting `connected.screen` to `nodeName.render` as in the example below,
where `nodeName` is the id of the node you want to connect to the display.

```json
{
    "id": "root",
        "type": "NIN.RootNode",
        "connected": {
            "screen": "nodeName.render"
        }
    }
}
```

## Shaders

Create a shader by clicking `Generate -> Shader Node` in the frontend menu.
It will be placed in the folder `src/shaders/nameOfTheShader/`.
To get livereload on shader change, you shader must be specified in the options object of your node in `res/graph.json`,
the shader generator will do this for you.
If needed, you can access the shader through the global `SHADERS` object, by writing `SHADERS.nameOfTheShader`.

## Compiling

The `nin compile` command will create a single file `bin/demo.png.html` that contains all the code and resources of your demo.
Base64 and PNG compression magic is used to achieve this.
It will at the same time output a file without PNG compression, `bin/demo.html`, which will be slightly larger, but compatible with a wider range of devices (especially smartphones).
For faster compiles, pass the flag `--no-closure-compiler`. This will only concatenate js files, without any minifying.

## .ninrc

Many of nin's settings can be overriden by placing a .ninrc file in your home directory.
Currently, keyboard shortcuts is the only behavior which can be changed in the .ninrc.
The list of canonical names for keybindings can be found in
[nin/frontend/app/scripts/directives/menubar.js](https://github.com/ninjadev/nin/blob/master/nin/frontend/app/scripts/directives/menubar.js).

An example .ninrc looks like the following:

```
[keybinds]
startRendering=left
stopRendering=right
```

## Rendering to video

1. `nin run`.
1. Open nin in your browser, navigate to the frame you want to render from, and press R. This will start dumping single frames as numbered .PNGs in `bin/render/`  in your project folder.
1. Refresh etc every time WebGL crashes.
1. When you have rendered all the frames: `nin render`. You need `ffmpeg` ([ffmpeg.org](http://ffmpeg.org/)) installed for this.
1. The demo is now available at `bin/render/render.mp4`.

Each frame will take up to around 4MB on disk, and the finished .mp4 will be on the order of 1GB when rendered, so make sure you have enough disk space.
Expect to render maybe a frame or two per second.

# Developer manual

## Setup

You will need to have node installed.

Running `make` in the nin folder will build and compile the entire project.
Running `npm link` will add nin to your node binaries path, making it available globally.

## Developing

First, run `nin run` inside your project.
If you wish to develop on the frontend, running `make run` inside `nin/frontend/` makes webpack rebuild the frontend on file change.
You only need to rerun `nin run` if you change files in either `nin/dasBoot` or `nin/backend`.

### Working with scenes

Usually, your demo will be a series of connected scenes. This section covers how to work with them.

#### Adding scenes

Adding a scene is quite straight forward, once you become good friends with graph.json!

##### How to add the first scene to a demo

This is what you need to to do get your first scene wired up and ready to go!

##### How to add a scene at the end of the demo

Here is an example of how to prolong the demo by adding a new scene at the end.

#### How to add a new scene between two existing scenes

Sometimes you want to squeeze in a new scene between two other scenes that you already have in your demo.
Often you will perhaps only shorten down on the length of the preceeding scene and leave the start of the following scene intact.
But for completenes, here is an example where we both shorten the previous scene, and chop down the beginning of the following scene.

### Time and timed events

A lot of making a demo is syncing what's happening on the screen with the music.

A `BEAN` can be described as the smallest possible resoluton of the beat.
If your musician is exiting the beat of your music could be something like every 4th, 6th, 4th, 6th, 10th, 2nd, bean.

Working with `BEAN`s directly will usually not give you a smooth 60 FPS animation.
`BEAN`s are incremented less often than 60 fps. A common approach is using `frame` with `FRAME_FOR_BEAN` instead.
E.g. Instead of doing
```js
var startBean = 1;
var endBean = 20;
var fractionIn = (BEAN - startBean) / (endBean - startBean);
```
do
```js
var startFrame = FRAME_FOR_BEAN(1);
var endFrame = FRAME_FOR_BEAN(20);
var fractionIn = (frame - startFrame) / (endFrame - startFrame);
```

|Counter|Description|Typical way to access|
| ----- |-----------| ------------------- |
| Bean | The smallest possible resoluton of the beat. | `BEAN` |
| Frame | Monotonously counts upwards. Usually what you want to use in your `update()`-function. | `frame` (if you need frame inside your `render` method, you can store it on `this` inside the `update` method) |
| Beat | ToDo | ToDo |
| Bar | ToDo | ToDo |

#### Notes on the `update(frame)`-function

In your scene-function, you can define an update function.

```js
update(frame) {
  // The coolest of code
}
```

This will run for every frame.

### Movement

You might have defined an object in your scene, such as a box, the camera, or a light source, which you want to move within your scene. To aid you in doing this smoothly, there are some predefined functions you can utilize.

The most important ones are:

* smoothstep
* lerp

They all have the same API:
`lerp(startValue, endValue, t)`

When `t` is smaller than or equal to 0, `startValue` is returned.
When `t` is between 0 and 1, a value between startValue and endValue is returned, depending on which interpolation function you're using.
When `t` is larger than 1, `endValue` is returned.

#### smoothstep

For more details, check out http://en.wikipedia.org/wiki/Smoothstep .

#### lerp

### Music

#### How to add music to your demo

In the `nin.json`-file you can define the `music`-section directly in the root.
Here you can specify

* where your music file is located in the `path`-field
* how many beats per minute you music supposedly is in the `bpm`-field

Sample music configuration:

```json
"music": {
  "path": "res/music.mp3",
  "bpm": 190,
  "subdivision": 12,
  "BEANOffset": 0
},
```

For details on how this section is processed further you can check out `nin/dasBoot/BEATBEAN.js`.

## Linting

The frontend part of this project uses ESLint for linting.
See the `.eslintrc.js` file in the frontend part of this project.

The demo itself and our own `dasBoot` uses the Google Closure Linter, please see this link for installation information.
`https://developers.google.com/closure/utilities/docs/linter_howto`
Use the `--nojsdoc` flag.

## Publishing nin

To publish nin type the command `make publish`.
To be able to publish you need access to the `ninjadev` user on npm whose password will be given through secure channels.

## Notes on working in windows

The prerequisites remain the same, you at least need Node.

To build and compile the entire project, for now, you need only run `npm start` in the root of the nin-repo.
To run nin without linking up through npm you can replace the `nin`-command with `node path-to-ninrepo/nin/backend/nin`.
E.g. when you are in a project folder of a demo, and you want to run it with your freshly compiled nin directly, you can run `node path-to-ninrepo/nin/backend/nin run` instead of `nin run`.

If you want to run it from powershell regurairly you might want to make an alias in your profile akin to this:

```powershell
function nin
{
    param($argz)
    node $ninRepoPath\nin\backend\nin $argz
}
```

Alternatively you can use the `psNin.ps1` script from your demo, or call it from anywhere if you supply it to the optional `$demoPath` parameter.

# Testimonials / Reviews

> nice! - [mrdoob](https://twitter.com/mrdoob/status/686575651923574790)

<!-- -->

> Oh man, I didn't know you guys released your tools. I'm a big fan of your stuff -- awesome to see such polished prods on the web. Happy to have helped enable some amazing work! - [daeken](https://news.ycombinator.com/item?id=12264461#unv_12265590)

# List of known nin projects

- [Ninjacon 2016: Sea Shark Invtro](https://github.com/stianjensen/ninjacon-invite)
- [Everything is Fashion](https://github.com/ninjadev/tyve)
- [Hold Kjæft](https://github.com/Raane/HoldKjeft)
- [Heatseeker](https://github.com/sigvef/heatseeker)
- [Inakuwa Oasis](https://github.com/ninjadev/en)
- [Stars and boxes](https://github.com/iver56/abel-demo-14)
- [Crankwork Steamfist](https://github.com/ninjadev/dix)
- [What Are You Syncing About?](https://github.com/ninjadev/re)
- [Zeven](https://github.com/ninjadev/zeven)
- [No Invitation](https://github.com/ninjadev/revision-invite-2018)
- [Pinky Frinky](https://github.com/ninjadev/pluss)
- [Look Closer](https://github.com/ninjadev/zoo)
- [Neon Fantasy](https://github.com/iver56/neon-fantasy)
