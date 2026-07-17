import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  render,
  screen,
  cleanup,
  waitFor,
  act,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastViewport } from './Toast';
import {
  showToast,
  dismissToast,
  __resetToastsForTests,
} from '@/hooks/useToast';

beforeEach(() => {
  __resetToastsForTests();
});

afterEach(() => {
  cleanup();
  __resetToastsForTests();
});

describe('<ToastViewport>', () => {
  it('renders nothing when there are no toasts', () => {
    render(<ToastViewport />);
    expect(
      screen.queryByRole('region', { name: /Notifications/i }),
    ).not.toBeInTheDocument();
  });

  it('renders the viewport after a toast is pushed', () => {
    render(<ToastViewport />);
    act(() => {
      showToast('Hello world', 'info');
    });
    expect(
      screen.getByRole('region', { name: /Notifications/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders the bracketed tone tag for every tone', () => {
    render(<ToastViewport />);
    act(() => {
      showToast('a', 'info');
      showToast('b', 'success');
      showToast('c', 'error');
    });
    expect(screen.getByText('[ INFO ]')).toBeInTheDocument();
    expect(screen.getByText('[ OK ]')).toBeInTheDocument();
    expect(screen.getByText('[ ERR ]')).toBeInTheDocument();
  });

  it('uses role=status for info and success, role=alert for error', () => {
    render(<ToastViewport />);
    act(() => {
      showToast('apple-pie', 'info');
      showToast('banana-bread', 'success');
      showToast('cherry-cake', 'error');
    });
    const statuses = screen.getAllByRole('status');
    expect(statuses).toHaveLength(2);
    expect(statuses[0]).toHaveTextContent('apple-pie');
    expect(statuses[1]).toHaveTextContent('banana-bread');
    expect(screen.getByRole('alert')).toHaveTextContent('cherry-cake');
  });

  it('renders the optional title above the message', () => {
    render(<ToastViewport />);
    act(() => {
      showToast('spot-7', 'success', { title: 'Deleted' });
    });
    const region = screen.getByRole('region', { name: /Notifications/i });
    expect(region).toHaveTextContent('Deleted');
    expect(region).toHaveTextContent('spot-7');
  });

  it('renders the action button and calls onClick then dismisses', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<ToastViewport />);
    act(() => {
      showToast('msg', 'error', {
        action: { label: 'Retry', onClick },
      });
    });
    const action = screen.getByRole('button', { name: 'Retry' });
    expect(action).toBeInTheDocument();
    await user.click(action);
    expect(onClick).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.queryByText('msg')).not.toBeInTheDocument();
    });
  });

  it('removes the toast when the dismiss button is clicked', async () => {
    const user = userEvent.setup();
    render(<ToastViewport />);
    act(() => {
      showToast('dismissable', 'info');
    });
    const dismiss = screen.getByRole('button', {
      name: /Dismiss notification/i,
    });
    await user.click(dismiss);
    await waitFor(() => {
      expect(screen.queryByText('dismissable')).not.toBeInTheDocument();
    });
  });

  it('exposes dismissToast as a manual handle', () => {
    render(<ToastViewport />);
    let id = '';
    act(() => {
      id = showToast('manual', 'info', { durationMs: 0 });
    });
    expect(screen.getByText('manual')).toBeInTheDocument();
    act(() => {
      dismissToast(id);
    });
    expect(screen.queryByText('manual')).not.toBeInTheDocument();
  });

  it('replaces a duplicate (tone, message) toast instead of stacking', () => {
    render(<ToastViewport />);
    act(() => {
      showToast('Same', 'error');
      showToast('Same', 'error');
      showToast('Same', 'error');
    });
    const matches = screen.getAllByText('Same');
    expect(matches).toHaveLength(1);
  });

  it('shows the "+N more" chip when the queue overflows', () => {
    render(<ToastViewport />);
    act(() => {
      showToast('one', 'info');
      showToast('two', 'info');
      showToast('three', 'info');
      showToast('four', 'info');
      showToast('five', 'info');
    });
    expect(screen.getByText('+2 more')).toBeInTheDocument();
  });

  it('hides the chip when the queue is under the cap', () => {
    render(<ToastViewport />);
    act(() => {
      showToast('one', 'info');
    });
    expect(screen.queryByText(/\+\d+ more/)).not.toBeInTheDocument();
  });
});
