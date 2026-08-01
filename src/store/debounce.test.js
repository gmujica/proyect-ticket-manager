import { debounce } from './debounce';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not run before the delay', () => {
    const fn = vi.fn();
    debounce(fn, 100)();

    vi.advanceTimersByTime(99);

    expect(fn).not.toHaveBeenCalled();
  });

  it('runs once the delay passes', () => {
    const fn = vi.fn();
    debounce(fn, 100)();

    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('collapses a burst into a single call', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced('a');
    debounced('b');
    debounced('c');
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('runs with the arguments of the last call', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced('a');
    debounced('b');
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledWith('b');
  });

  it('restarts the delay on every call', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    vi.advanceTimersByTime(80);
    debounced();
    vi.advanceTimersByTime(80);

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(20);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('runs again for a second burst', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    vi.advanceTimersByTime(100);
    debounced();
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(2);
  });

  describe('flush', () => {
    it('runs the pending call immediately', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced('now');
      debounced.flush();

      expect(fn).toHaveBeenCalledWith('now');
    });

    it('does not run it a second time when the timer would have fired', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced();
      debounced.flush();
      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('does nothing when there is nothing pending', () => {
      const fn = vi.fn();

      debounce(fn, 100).flush();

      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('drops the pending call', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced();
      debounced.cancel();
      vi.advanceTimersByTime(100);

      expect(fn).not.toHaveBeenCalled();
    });

    it('leaves a later call working', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced();
      debounced.cancel();
      debounced('after');
      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledWith('after');
    });
  });
});
