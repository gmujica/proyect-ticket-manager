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
and from then on it is stored in [Cloudflare D1](https://developers.cloudflare.com/d1/)
and synced across devices.

The backend is a set of [Pages Functions](https://developers.cloudflare.com/pages/functions/)
under `functions/`, served from the same origin as the app — which is why there is
no CORS handling and the session cookie is first party.

| Endpoint             | Purpose                                     |
|----------------------|---------------------------------------------|
| `GET /api/auth/login`    | Redirects to GitHub with a signed state |
| `GET /api/auth/callback` | Exchanges the code, opens the session   |
| `POST /api/auth/logout`  | Deletes the session                     |
| `GET /api/me`            | The current user, or `null`             |
| `GET`/`PUT /api/board`   | Reads and writes the stored board       |

## Running the backend locally

`npm run dev` only serves the frontend, so `/api/*` is not available there. To
exercise sign-in you need Wrangler, which serves `dist` and `functions/` together
on port 8788.

**1. Create a GitHub OAuth App** at
[Settings → Developer settings → OAuth Apps](https://github.com/settings/developers)
→ *New OAuth App*, with:

- **Homepage URL** — `http://localhost:8788`
- **Authorization callback URL** — `http://localhost:8788/api/auth/callback`

The callback is derived from the request origin in `functions/api/auth/login.js`,
so it has to match the port exactly. Use a separate app for production.

**2. Fill in `.dev.vars`** (copy it from `.dev.vars.example` if it is missing) with
the client ID and a generated client secret. The file is git-ignored.

**3. Apply the migrations** to the local database, which is a SQLite file under
`.wrangler/` and is unrelated to the `database_id` in `wrangler.toml`:

```shell
npm run db:migrate:local
```

**4. Start it** with `npm run pages:dev` and open
[http://localhost:8788](http://localhost:8788). The script builds first, because
Wrangler serves the contents of `dist` rather than the Vite dev server; Functions
themselves do reload on save.

## Deploying

Beyond the steps above, production needs the real database and the secrets:

```shell
npx wrangler d1 create ptm-board   # paste the id into wrangler.toml
npm run db:migrate
npx wrangler pages secret put GITHUB_CLIENT_ID
npx wrangler pages secret put GITHUB_CLIENT_SECRET
```

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
