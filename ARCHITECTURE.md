# Nin Architecture Document

This document contains a tentative draft of the architecture for `nin`.


## Command Line Interface

`nin`
    
Serves the current directory as a nin project.


`nin init [FOLDER]`
    
Starts a new nin project in FOLDER, or in the current directory if FOLDER is
not specified.


`nin compile`
    
Compiles the project to the `bin/` folder.


`nin clean`
    
Deletes the `bin/` folder.



## Component Interaction Overview

```
+ --  --  --  --  --  --  --  --  --  --  --  -- +
|                                                |
|  +-----+         +---------+         +-----+   |
|  | vim |         | Browser |         | cli |   |- User Interface
|  +-----+         +---------+         +-----+   |
|     ^                 ^                 ^      |
+ --  |-  --  --  --  --| --  --  --  --  |-  -- +
      |                 |                 |
 save / load        websockets         commands    
      |                 |                 | 
      |                 |                 |
      |                 v                 |
      |              +-----+              |
      |              | nin | <------------+
      |              +-----+
      |                 ^
      |                 |
      |                 |
      |        watching / writing
      |                 |
      |                 |
      v                 v
   +-----------------------------------------+
   |           nin project on disk           |
   +-----------------------------------------+
```


# Demo conventions

A demo consists of:

- A soundtrack in mp3 format at `res/music.mp3`
- One or several layer definitions at `src/layers/*Layer.js`
- a json file at `res/layers.json` describing which layers render at which
  times and with which parameters.
