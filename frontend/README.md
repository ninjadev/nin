# nin

> nin is ninjatool

Nin is Ninjadev's internal demo tool.
It is a tool for easing development of browser-based WebGL demos.

## Setting up dev environment

```
make setup
```

Periodically, do:

```
make
```

To run the server, do:

```
make run
```

Open the `/backend/public/` dir to see the result.

* Write your code in `app` dir.
* Put static files that should be copied (index.html etc) to `app/assets`.
* Manage dependencies with ghetto-bower.
