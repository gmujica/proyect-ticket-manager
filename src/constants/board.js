// Mirrors the limit the API enforces in `src/lib/boardSchema.js` of the ptm-api
// repository. Duplicated rather than discovered: the dialog has to say "too
// long" while the person is still typing, and a round trip is not that.
export const MAX_BOARD_NAME_LENGTH = 60;

// What the account's first board is called when it is created out of the board
// the visitor already had in this browser. Nobody gets asked for a name at that
// moment — they were in the middle of signing in, not of creating a board — so
// this only has to be recognisable, and it can be renamed afterwards.
export const DEFAULT_BOARD_NAME = 'My board';
