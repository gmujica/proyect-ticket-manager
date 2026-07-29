// Adds matchers like toBeInTheDocument / toHaveTextContent to `expect`.
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// React Testing Library only auto-cleans when a global `afterEach` exists at
// import time; registering it here keeps rendered trees from leaking between
// tests regardless of how the suite is run.
afterEach(() => {
  cleanup();
});