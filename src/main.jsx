import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import CssBaseline from '@mui/material/CssBaseline';
import store from './store';
import App from './components/App';
import * as api from './api/client';
import { bootstrapSession, startBoardSync } from './store/sync';
import './index.css';

// Started outside React on purpose: StrictMode runs effects twice in
// development, which would mean two /api/me calls and, on a first sign-in, two
// uploads of the same board.
const stopSync = startBoardSync(store, api);

bootstrapSession(store, api);

// The push to the server is debounced, so a tab closed right after an edit
// would drop it. `pagehide` fires for closes, navigations and bfcache alike.
// The browser may still cut a request short during unload; localStorage is what
// actually guarantees the board survives, this only narrows the gap.
window.addEventListener('pagehide', stopSync);

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <CssBaseline />
      <App />
    </Provider>
  </React.StrictMode>
);
