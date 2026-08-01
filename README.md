# Proyect Ticket Manager

A lightweight ticket board for working with the Scrum methodology.

## Features

- Drag & drop cards between lists, and reorder the lists themselves
- Each ticket has a **type** (Task / Bug / Story) and a **priority**
  (Highest → Lowest), both shown as colour-coded icons on the card
- Delete a card from the button that appears when you hover it
- The board is **persisted to Local Storage**, so it survives a reload

## Pre Requisites

Node.js 20 or newer. Install the dependencies with:

```shell
npm install
```

# React Project

This project runs on [Vite](https://vite.dev/). In the project directory you can run:

### `npm run dev`

Runs the app in development mode with hot module replacement.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser (Vite picks the
next free port if 3000 is taken).

### `npm run build`

Builds the app for production into the `dist` folder.<br />
The build is minified and the filenames include hashes.

### `npm run preview`

Serves the production build locally so you can verify it before deploying.

### `npm run deploy`

Builds and publishes `dist` to GitHub Pages.

# Accounts and sync

Signing in is optional. Without a session the board lives in Local Storage exactly
as it always has; on the first sign-in that local board is uploaded to the account,
and from then on it is stored server-side and synced across devices.

**The backend is a separate repository**, [ptm-api](https://github.com/gmujica/api),
deployed as a Cloudflare Worker on its own domain. This repository holds only the
frontend. `src/api/client.js` is the whole of the contact between them.

Because the two live on different domains, every call goes out with
`credentials: 'include'` and the session cookie is a third-party cookie. Browsers
that block those — Safari by default — will not keep it, and sign-in fails there.
The board itself keeps working: a failed `/api/me` falls back to Local Storage.

## Pointing at the API

`VITE_API_URL` says where the backend is. It is committed, not secret:

| File               | Value                                   |
|--------------------|-----------------------------------------|
| `.env.development` | `http://localhost:8788`                 |
| `.env.production`  | `https://ptm-api.gmujica.workers.dev`   |

It has to match the API's own `FRONTEND_ORIGIN` in the other direction, exactly
and with no trailing slash, or CORS rejects the calls.

## Running both halves locally

Two terminals. Here, `npm run dev` on port 3000; in the `api` repository,
`npm run dev` on port 8788. Its README covers the OAuth App and the local
database. Without the backend running the app still works, unauthenticated.

# Development technologies

- [React](https://react.dev/) 19
- [Redux Toolkit](https://redux-toolkit.js.org/) + [React Redux](https://react-redux.js.org/)
- [MUI](https://mui.com/) 9 (styling via its Emotion-based `styled` and `sx`)
- [@hello-pangea/dnd](https://github.com/hello-pangea/dnd) — maintained fork of react-beautiful-dnd
- [Vite](https://vite.dev/)
- Local Storage for persistence

__NOTE__ The board is saved in your browser under the `ptm.board.v1` key. Clearing
site data resets it to the seed board.

# Images

![](./src/img/1.png)

- You can create new tasks

![](./src/img/2.png)

- You can create new lists

![](./src/img/3.png)

- you can move them in a similar way to Trello

![](./src/img/4.png)
