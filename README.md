# nin

> nin is ninjatool

This project has a node backend that keeps track of all files and compiles files as they are edited.
The frontend of this project is written in Angular and displays among other the layers that the demo consists of.

## Setup

You will need to have node and npm installed.

Run `make setup` in the `frontend` folder and `make` in the `nin` folder.

*See the README in the frontend folder for more details.*


### Commands to try if it does not work:

sudo apt-get install g++
sudo npm install -g grunt-cli

## Shaders

Every project has its own shader folder.
This folder has a folder for each shader.
These shaders will be compiled into the global object `SHADERS`, so to access a shader one would write for instance `SHADERS.example`.
