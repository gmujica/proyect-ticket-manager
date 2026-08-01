// Thin wrapper over the Pages Functions under /api. Everything is same-origin,
// so the session cookie rides along on its own and there is no token for this
// layer to hold — which is the point of keeping it in an HttpOnly cookie.

const request = async (path, options = {}) => {
    const response = await fetch(path, {
        credentials: 'same-origin',
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

export const LOGIN_URL = '/api/auth/login';
