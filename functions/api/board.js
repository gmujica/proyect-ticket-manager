import { normalizeBoard } from '../../src/store/boardSchema';
import { loadUserBoard, saveUserBoard } from '../lib/db';
import { json, serverError, unauthorized, userFor } from '../lib/http';

// A board is a few kB of text in normal use. The cap is here so a signed-in
// account cannot be used to park megabytes in D1 one request at a time; it sits
// far above anything the UI can produce.
const MAX_BOARD_BYTES = 512 * 1024;

export const onRequestGet = async context => {
  const user = await userFor(context);

  if (!user) {
    return unauthorized();
  }

  const raw = await loadUserBoard(context.env.DB, user.id);

  if (raw === null) {
    // No board stored yet, which is not an error: it is what the client needs
    // to know in order to offer uploading the local one.
    return json({ board: null });
  }

  try {
    return json({ board: normalizeBoard(JSON.parse(raw)) ?? null });
  } catch {
    // Stored JSON that no longer parses is treated as no board rather than as a
    // failure, so a bad row cannot lock a user out of their own account.
    return json({ board: null });
  }
};

export const onRequestPut = async context => {
  const user = await userFor(context);

  if (!user) {
    return unauthorized();
  }

  let payload;

  try {
    const text = await context.request.text();

    if (text.length > MAX_BOARD_BYTES) {
      return json({ error: 'Board is too large' }, { status: 413 });
    }

    payload = JSON.parse(text);
  } catch {
    return json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Validated with the same rules the browser applies to localStorage: whatever
  // the client claims about its shape is checked again here.
  const board = normalizeBoard(payload?.board);

  if (!board) {
    return json({ error: 'Invalid board' }, { status: 400 });
  }

  try {
    const { updatedAt } = await saveUserBoard(context.env.DB, user.id, board);

    return json({ updatedAt });
  } catch {
    return serverError();
  }
};
