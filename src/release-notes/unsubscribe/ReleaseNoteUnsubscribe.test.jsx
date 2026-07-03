import React from 'react';
import {
  render, screen, fireEvent, initializeMocks, waitFor,
} from 'CourseAuthoring/testUtils';

import ReleaseNoteUnsubscribe from './ReleaseNoteUnsubscribe';
import messages from './messages';
import * as api from '../data/api';

const renderUnsubscribePage = (search = '') => render(
  <ReleaseNoteUnsubscribe />,
  {
    path: '/release-notes/unsubscribe',
    routerProps: { initialEntries: [`/release-notes/unsubscribe${search}`] },
  },
);

describe('ReleaseNoteUnsubscribe', () => {
  beforeEach(() => {
    initializeMocks();
  });

  test('renders invalid state when token is missing', () => {
    renderUnsubscribePage();
    expect(screen.getByText(messages.unsubscribeInvalidTitle.defaultMessage)).toBeInTheDocument();
    expect(screen.getByText(messages.unsubscribeInvalid.defaultMessage)).toBeInTheDocument();
  });

  test('renders the idle confirmation state when token is present', () => {
    renderUnsubscribePage('?token=signed-token');
    expect(screen.getByText(messages.unsubscribeTitle.defaultMessage)).toBeInTheDocument();
    expect(screen.getByText(messages.unsubscribeConfirmation.defaultMessage)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: messages.unsubscribeButton.defaultMessage }),
    ).toBeInTheDocument();
  });

  test('calls unsubscribeFromReleaseNoteEmails with token and shows success state on success', async () => {
    const spy = jest.spyOn(api, 'unsubscribeFromReleaseNoteEmails').mockResolvedValue({ message: 'ok' });
    renderUnsubscribePage('?token=signed-token');

    fireEvent.click(screen.getByRole('button', { name: messages.unsubscribeButton.defaultMessage }));

    await waitFor(() => {
      expect(screen.getByText(messages.unsubscribeSuccessTitle.defaultMessage)).toBeInTheDocument();
    });
    expect(spy).toHaveBeenCalledWith('signed-token');
  });

  test('shows error state and allows retry on failure', async () => {
    const spy = jest.spyOn(api, 'unsubscribeFromReleaseNoteEmails').mockRejectedValue(new Error('boom'));
    renderUnsubscribePage('?token=signed-token');

    fireEvent.click(screen.getByRole('button', { name: messages.unsubscribeButton.defaultMessage }));

    await waitFor(() => {
      expect(screen.getByText(messages.unsubscribeErrorTitle.defaultMessage)).toBeInTheDocument();
    });
    expect(spy).toHaveBeenCalledTimes(1);

    spy.mockResolvedValueOnce({ message: 'ok' });
    fireEvent.click(screen.getByRole('button', { name: messages.unsubscribeRetry.defaultMessage }));

    await waitFor(() => {
      expect(screen.getByText(messages.unsubscribeSuccessTitle.defaultMessage)).toBeInTheDocument();
    });
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
