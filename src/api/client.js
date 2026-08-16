// Thin wrapper over the API, which is a separate Worker on its own domain (see
// the ptm-api repository). There is still no token for this layer to hold: the
// session lives in an HttpOnly cookie the browser attaches on its own.
//
// `credentials: 'include'` rather than 'same-origin' is what that separation
// costs. It is also why the cookie has to be SameSite=None, and therefore why
// sign-in does not work in browsers that block third-party cookies.
//
// The endpoints here are the ones under /api/boards. The API also still answers
// the older /api/board, against the first board of the account, but only so that
// a frontend deployed before this one keeps saving; nothing here should use it.

// Empty in a build with no API configured, which leaves every path relative and
// makes the app fall back to localStorage instead of calling a wrong host.
const API_BASE = import.meta.env.VITE_API_URL ?? '';

/**
 * A request the API refused. `detail` is the sentence the API sent — "Too many
 * boards", "Board already exists" — which is worth putting in front of the
 * person, unlike the status code.
 */
export class ApiError extends Error {
    constructor(method, path, status, detail) {
        super(`${method} ${path} failed: ${status}`);
        this.name = 'ApiError';
        this.status = status;
        this.detail = detail;
    }
}

const readJson = async response => {
    try {
        return await response.json();
    } catch {
        // A body that is not JSON: a proxy error page, or an empty response
        return null;
    }
};

const request = async (path, { missingAsNull = false, ...init } = {}) => {
    const response = await fetch(`${API_BASE}${path}`, {
        credentials: 'include',
        ...init
    });

    // 401 is not a failure here, it is the answer to "is anyone signed in".
    if (response.status === 401) {
        return { status: 401, body: null };
    }

    // Neither is 404, for a caller that asked about a board that may be gone:
    // another tab, or another device, may have deleted it since this one last
    // looked at the list.
    if (response.status === 404 && missingAsNull) {
        return { status: 404, body: null };
    }

    if (!response.ok) {
        const body = await readJson(response);

        throw new ApiError(
            init.method ?? 'GET',
            path,
            response.status,
            body?.error ?? null
        );
    }

    return { status: response.status, body: await response.json() };
};

const send = (path, method, payload) =>
    request(path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

const boardPath = id => `/api/boards/${encodeURIComponent(id)}`;

/** The signed-in user, or null when nobody is. */
export const fetchMe = async () => {
    const { body } = await request('/api/me');

    return body?.user ?? null;
};

/**
 * The account's boards, without their contents, in the order the account put
 * them in. An empty array is meaningful: it is what tells the caller this is a
 * first sign-in and the board in the browser is worth uploading.
 */
export const fetchBoards = async () => {
    const { body } = await request('/api/boards');

    return body?.boards ?? [];
};

/**
 * One board with its lists, or null when the account has no board by that id.
 * Name and contents arrive together, so opening a board is a single request.
 */
export const fetchBoard = async id => {
    const { body } = await request(boardPath(id), { missingAsNull: true });

    return body ? { board: body.board, lists: body.lists } : null;
};

export const putBoard = async (id, lists) => {
    const { body } = await send(boardPath(id), 'PUT', { lists });

    return body?.updatedAt ?? null;
};

/** Creates an empty board. Its columns are a separate `putBoard`. */
export const createBoard = async name => {
    const { body } = await send('/api/boards', 'POST', { name });

    return body?.board ?? null;
};

export const renameBoard = async (id, name) => {
    const { body } = await send(boardPath(id), 'PATCH', { name });

    return body?.board ?? null;
};

/** Deletes the board and everything on it. */
export const deleteBoard = async id => {
    await request(boardPath(id), { method: 'DELETE' });
};

export const logout = async () => {
    await request('/api/auth/logout', { method: 'POST' });
};

// A full URL, not a path: this one is followed by a browser navigation rather
// than by fetch, so it has to point at the API's own origin.
export const LOGIN_URL = `${API_BASE}/api/auth/login`;