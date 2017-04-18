# nin

*DISCLAIMER*: This is a tool created for internal use by Ninjadev, and is open sourced to share ideas with and get feedback from the community.
You are free to use it, according to the License, but we will not necessarily provide support and may at any time add, change or remove features as we require for our productions.

![](https://github.com/ninjadev/nin/blob/master/nin-preview.PNG)

> nin is ninjatool

nin is Ninjadev's internal demo tool.
It is a tool for easing development of browser-based WebGL demos.
Core features include:

- Node-based demotool, effortlessly reuse your effects, scenes, and create crazy transitions.
- Livereloading of shaders and scenes in the browser. No more manual recompilation!
- Tight THREE.js integration for all your WebGL needs.
- Compile and pack your WebGL demo to a .png.html file for easy compo delivery

The backend component is written in node.js, and keeps track of and recompiles changed files.
The frontend is a mix of react and angular components, which communicates with the backend over websockets.

# User manual

## Installing nin

To install nin simply run the command `npm install -g ninjadev-nin`.
This projects requires node version `7.1.0` or newer.

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
To compile without PNG compression, use `nin compile --no-png-compression`.
That will yield a slightly larger file, but more browsers and smartphones will be able to run it.

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

You will need to have node, yarn and webpack installed.
Yarn installation guide is available [here](https://yarnpkg.com/en/docs/install).
If you already have npm installed you can bootstrap to yarn by running `npm install -g yarn`.
Install webpack by running `npm install -g webpack`.

Running `make` in the nin folder will build and compile the entire project.
Running `npm link` will add nin to your node binaries path, making it available globally.

# Developing

First, run `nin run` inside your project.
If you wish to develop on the frontend, running `make run` inside `nin/frontend/` makes webpack rebuild the frontend on file change.
You only need to rerun `nin run` if you change files in either `nin/dasBoot` or `nin/backend`.

## Linting

The frontend part of this project uses ESLint for linting.
See the `.eslintrc.js` file in the frontend part of this project.

The demo itself and our own `dasBoot` uses the Google Closure Linter, please see this link for installation information.
`https://developers.google.com/closure/utilities/docs/linter_howto`
Use the `--nojsdoc` flag.

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
- [What Are You Syncing About?](https://github.com/ninjadev/re)
