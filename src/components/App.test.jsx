import { render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/authSlice';
import filtersReducer from '../store/filtersSlice';
import listsReducer from '../store/listsSlice';
import App from './App';

// A fresh store per test rather than the singleton in src/store: that one reads
// localStorage at import time, which would leak one test's board into the next.
// `auth` is included because the header reads it; it stays in its initial
// `checking` state, which is what an anonymous visitor sees before /api/me
// answers.
const mountApp = () => {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      filters: filtersReducer,
      lists: listsReducer
    }
  });
  const user = userEvent.setup();

  render(
    <Provider store={store}>
      <App />
    </Provider>
  );

  return { store, user };
};

// The about dialog opens on load and is aria-modal, so everything behind it is
// hidden from assistive tech (and from role queries). Dismiss it first, exactly
// as a visitor does, before touching the board.
const renderBoard = async () => {
  const { store, user } = mountApp();

  await user.click(screen.getByRole('button', { name: 'Agree' }));
  // MUI fades the dialog out, so it lingers in the DOM after the click
  await waitForElementToBeRemoved(() => screen.queryByRole('dialog'));

  return { store, user };
};

const cardTexts = store =>
  store.getState().lists.flatMap(list => list.cards.map(card => card.text));

describe('the about dialog', () => {
  it('is open on load', () => {
    mountApp();

    expect(
      screen.getByRole('dialog', { name: 'Development technologies' })
    ).toBeInTheDocument();
  });

  it('closes on Agree', async () => {
    const { user } = mountApp();

    await user.click(screen.getByRole('button', { name: 'Agree' }));

    await waitForElementToBeRemoved(() => screen.queryByRole('dialog'));
  });

  it('closes on the close button', async () => {
    const { user } = mountApp();

    await user.click(screen.getByRole('button', { name: 'close' }));

    await waitForElementToBeRemoved(() => screen.queryByRole('dialog'));
  });

  it('can be reopened from the header', async () => {
    const { user } = await renderBoard();

    await user.click(screen.getByRole('button', { name: 'about this project' }));

    expect(
      screen.getByRole('dialog', { name: 'Development technologies' })
    ).toBeInTheDocument();
  });
});

describe('App', () => {
  it('renders the seed lists', async () => {
    await renderBoard();

    expect(screen.getByRole('heading', { name: 'To Do List' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'In Process' })).toBeInTheDocument();
  });

  it('renders the cards of each list', async () => {
    await renderBoard();

    expect(screen.getByText('Set up the project board')).toBeInTheDocument();
    expect(screen.getByText('Login fails with an expired session token')).toBeInTheDocument();
    expect(screen.getByText('Update the deployment documentation')).toBeInTheDocument();
  });

  it('labels each card with its type and priority', async () => {
    await renderBoard();

    // the bug seed card: type Bug, priority Highest
    expect(screen.getByLabelText('Type: Bug')).toBeInTheDocument();
    expect(screen.getByLabelText('Priority: Highest')).toBeInTheDocument();
  });

  it('adds a card through the form', async () => {
    const { store, user } = await renderBoard();

    await user.click(screen.getAllByText('Add another card')[0]);
    await user.type(
      screen.getByPlaceholderText('Enter a title for this card...'),
      'Write the tests'
    );
    await user.click(screen.getByRole('button', { name: 'Add Card' }));

    expect(screen.getByText('Write the tests')).toBeInTheDocument();
    expect(store.getState().lists[0].cards.at(-1)).toMatchObject({
      text: 'Write the tests',
      type: 'task',
      priority: 'medium'
    });
  });

  it('ignores a card submitted with only whitespace', async () => {
    const { store, user } = await renderBoard();
    const before = cardTexts(store).length;

    await user.click(screen.getAllByText('Add another card')[0]);
    await user.type(screen.getByPlaceholderText('Enter a title for this card...'), '   ');
    await user.click(screen.getByRole('button', { name: 'Add Card' }));

    expect(cardTexts(store)).toHaveLength(before);
  });

  it('adds a list through the form', async () => {
    const { store, user } = await renderBoard();

    await user.click(screen.getByText('Add another list'));
    await user.type(screen.getByPlaceholderText('Enter list title...'), 'Done');
    await user.click(screen.getByRole('button', { name: 'Add List' }));

    expect(screen.getByRole('heading', { name: 'Done' })).toBeInTheDocument();
    expect(store.getState().lists).toHaveLength(3);
  });

  it('closes the form without adding anything', async () => {
    const { store, user } = await renderBoard();
    const before = cardTexts(store).length;

    await user.click(screen.getAllByText('Add another card')[0]);
    await user.type(
      screen.getByPlaceholderText('Enter a title for this card...'),
      'never mind'
    );
    await user.click(screen.getByRole('button', { name: 'Close form' }));

    expect(cardTexts(store)).toHaveLength(before);
    expect(screen.queryByText('never mind')).not.toBeInTheDocument();
  });

  it('deletes a card', async () => {
    const { store, user } = await renderBoard();

    await user.click(
      screen.getByRole('button', { name: 'Delete card: Set up the project board' })
    );

    expect(screen.queryByText('Set up the project board')).not.toBeInTheDocument();
    expect(cardTexts(store)).not.toContain('Set up the project board');
    // the sibling card in the same list is untouched
    expect(screen.getByText('Login fails with an expired session token')).toBeInTheDocument();
  });
});

describe('the filter bar', () => {
  // MUI selects are not real <select> elements: open the listbox, then pick the
  // option by name, the way a visitor does.
  const choose = async (user, filterName, optionName) => {
    await user.click(screen.getByRole('combobox', { name: filterName }));
    await user.click(screen.getByRole('option', { name: optionName }));
  };

  it('shows every card before a filter is picked', async () => {
    await renderBoard();

    expect(screen.getByText('Set up the project board')).toBeInTheDocument();
    expect(screen.getByText('Login fails with an expired session token')).toBeInTheDocument();
    expect(screen.queryByText(/Showing \d+ of \d+ cards/)).not.toBeInTheDocument();
  });

  it('hides the cards whose type does not match', async () => {
    const { user } = await renderBoard();

    await choose(user, 'Filter by type', 'Bug');

    // the one Bug seed card stays, the Task and Story ones go
    expect(screen.getByText('Login fails with an expired session token')).toBeInTheDocument();
    expect(screen.queryByText('Set up the project board')).not.toBeInTheDocument();
    expect(screen.queryByText('Update the deployment documentation')).not.toBeInTheDocument();
  });

  it('hides the cards whose priority does not match', async () => {
    const { user } = await renderBoard();

    await choose(user, 'Filter by priority', 'Low');

    expect(screen.getByText('Update the deployment documentation')).toBeInTheDocument();
    expect(screen.queryByText('Set up the project board')).not.toBeInTheDocument();
  });

  it('combines type and priority', async () => {
    const { user } = await renderBoard();

    await choose(user, 'Filter by type', 'Task');
    await choose(user, 'Filter by priority', 'Low');

    // only the Task/Low card satisfies both
    expect(screen.getByText('Update the deployment documentation')).toBeInTheDocument();
    expect(screen.queryByText('Set up the project board')).not.toBeInTheDocument();
    expect(screen.getByText('Showing 1 of 4 cards')).toBeInTheDocument();
  });

  it('explains a list left with nothing visible', async () => {
    const { user } = await renderBoard();

    await choose(user, 'Filter by type', 'Bug');

    // "In Process" holds a Story and a Task, so it ends up fully hidden
    expect(screen.getByText('No cards match the filter')).toBeInTheDocument();
  });

  it('never removes the hidden cards from the board', async () => {
    const { store, user } = await renderBoard();

    await choose(user, 'Filter by type', 'Bug');

    expect(cardTexts(store)).toHaveLength(4);
  });

  it('brings every card back on Clear filters', async () => {
    const { user } = await renderBoard();

    await choose(user, 'Filter by type', 'Bug');
    await user.click(screen.getByRole('button', { name: /Clear filters/ }));

    expect(screen.getByText('Set up the project board')).toBeInTheDocument();
    expect(screen.getByText('Update the deployment documentation')).toBeInTheDocument();
    expect(screen.queryByText('No cards match the filter')).not.toBeInTheDocument();
  });
});