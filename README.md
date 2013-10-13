# nin

> nin is ninjatool

This project is divided into two parts:

**Frontend** is a web app built using angular and bootstrap.

**Backend** contains a command line utility called `nin`, and functions as the server for the client side app in `frontend`.

## Running it

Run frontend and backend at the same time:

In the frontend folder:

```
make run
````

In the backend folder:

```
make run
```

Open your browser (which is google chrome, btw) with the --disable-web-security flag.

#### Mac OS X:

```
open /Applications/Google\ Chrome.app/ --args --disable-web-security
```

#### Windows:

```
chrome.exe --disable-web-security
```

## Setup

You will need to have node and npm installed.

Run `make setup` in the `frontend` folder and `make` in the `backend` folder.
