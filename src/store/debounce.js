/**
 * Collapses a burst of calls into one, run `delay` ms after the last of them.
 *
 * `flush` exists for page unload: the board is saved to the server on a delay,
 * so without a way to run the pending call immediately, closing the tab a few
 * hundred milliseconds after the last edit would drop it.
 */
export const debounce = (fn, delay) => {
    let timer = null;
    let pending = null;

    const run = () => {
        const args = pending;

        timer = null;
        pending = null;

        if (args) {
            fn(...args);
        }
    };

    const debounced = (...args) => {
        pending = args;

        if (timer !== null) {
            clearTimeout(timer);
        }

        timer = setTimeout(run, delay);
    };

    debounced.flush = () => {
        if (timer !== null) {
            clearTimeout(timer);
            run();
        }
    };

    debounced.cancel = () => {
        if (timer !== null) {
            clearTimeout(timer);
        }

        timer = null;
        pending = null;
    };

    return debounced;
};
