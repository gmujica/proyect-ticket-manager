// Adds matchers like toBeInTheDocument / toHaveTextContent to `expect`.
import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterEach } from 'vitest';

// The default 1s ceiling on waitFor / waitForElementToBeRemoved is enough for
// MUI's 225ms dialog transition on an idle machine, but not on a loaded CI
// runner. A genuinely broken expectation still fails, just a few seconds later.
configure({ asyncUtilTimeout: 5000 });

// React Testing Library only auto-cleans when a global `afterEach` exists at
// import time; registering it here keeps rendered trees from leaking between
// tests regardless of how the suite is run.
afterEach(() => {
  cleanup();
});