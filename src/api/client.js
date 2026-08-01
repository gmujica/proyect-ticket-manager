// Thin wrapper over the API, which is a separate Worker on its own domain (see
// the ptm-api repository). There is still no token for this layer to hold: the
// session lives in an HttpOnly cookie the browser attaches on its own.
//
// `credentials: 'include'` rather than 'same-origin' is what that separation
// costs. It is also why the cookie has to be SameSite=None, and therefore why
// sign-in does not work in browsers that block third-party cookies.

// Empty in a build with no API configured, which leaves every path relative and
// makes the app fall back to localStorage instead of calling a wrong host.
const API_BASE = import.meta.env.VITE_API_URL ?? '';

const request = async (path, options = {}) => {
    const response = await fetch(`${API_BASE}${path}`, {
        credentials: 'include',
        ...options
    });

    // 401 is not a failure here, it is the answer to "is anyone signed in".
    if (response.status === 401) {
        return { status: 401, body: null };
    }

    if (!response.ok) {
        throw new Error(`${options.method ?? 'GET'} ${path} failed: ${response.status}`);
    }

    return { status: response.status, body: await response.json() };
};

/** The signed-in user, or null when nobody is. */
export const fetchMe = async () => {
    const { body } = await request('/api/me');

    return body?.user ?? null;
};

/**
 * The board stored for the signed-in user, or null when they have none yet.
 * The null is meaningful: it is what tells the caller this is a first sign-in
 * and the local board is worth uploading rather than discarding.
 */
export const fetchBoard = async () => {
    const { body } = await request('/api/board');

    return body?.board ?? null;
};

export const putBoard = async lists => {
    const { body } = await request('/api/board', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ board: lists })
    });

    return body?.updatedAt ?? null;
};

export const logout = async () => {
    await request('/api/auth/logout', { method: 'POST' });
};

// A full URL, not a path: this one is followed by a browser navigation rather
// than by fetch, so it has to point at the API's own origin.
export const LOGIN_URL = `${API_BASE}/api/auth/login`;
