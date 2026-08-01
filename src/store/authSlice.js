import { createSlice } from '@reduxjs/toolkit';

// `checking` is the state on boot, before /api/me has answered. It exists so the
// header can avoid flashing a "Sign in" button at someone who is already signed
// in — a wrong answer shown briefly reads as a bug.
const initialState = { user: null, status: 'checking', syncing: false };

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        signedIn(state, action) {
            state.user = action.payload;
            state.status = 'authenticated';
        },

        signedOut(state) {
            state.user = null;
            state.status = 'anonymous';
            state.syncing = false;
        },

        syncStarted(state) {
            state.syncing = true;
        },

        syncSettled(state) {
            state.syncing = false;
        }
    }
});

export const isAuthenticated = state => state.auth.status === 'authenticated';

export const { signedIn, signedOut, syncStarted, syncSettled } =
    authSlice.actions;

export default authSlice.reducer;
