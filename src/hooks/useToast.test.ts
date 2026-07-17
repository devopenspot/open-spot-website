import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
  showToast,
  dismissToast,
  useToast,
  __resetToastsForTests,
} from '@/hooks/useToast';

beforeEach(() => {
  vi.useFakeTimers();
  __resetToastsForTests();
});

afterEach(() => {
  vi.useRealTimers();
  __resetToastsForTests();
});

describe('showToast', () => {
  it('returns a unique id', () => {
    const a = showToast('one', 'info');
    const b = showToast('two', 'info');
    expect(a).not.toBe(b);
    expect(a).toMatch(/^toast-\d+$/);
  });

  it('enqueues toasts for subscribers', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      showToast('hello', 'info');
    });
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]?.message).toBe('hello');
    expect(result.current.toasts[0]?.tone).toBe('info');
  });

  it('defaults tone to info', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      showToast('hi');
    });
    expect(result.current.toasts[0]?.tone).toBe('info');
  });

  it('attaches title, action, and durationMs from options', () => {
    const { result } = renderHook(() => useToast());
    const onClick = vi.fn();
    act(() => {
      showToast('body', 'success', {
        title: 'Saved',
        action: { label: 'Undo', onClick },
        durationMs: 9999,
      });
    });
    const t = result.current.toasts[0];
    expect(t?.title).toBe('Saved');
    expect(t?.action?.label).toBe('Undo');
    expect(t?.durationMs).toBe(9999);
  });

  it('applies smart default duration per tone', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      showToast('a', 'info');
      showToast('b', 'success');
      showToast('c', 'error');
    });
    const byTone = new Map(result.current.toasts.map((t) => [t.tone, t]));
    expect(byTone.get('info')?.durationMs).toBe(3000);
    expect(byTone.get('success')?.durationMs).toBe(2800);
    expect(byTone.get('error')?.durationMs).toBe(6000);
  });

  it('auto-dismisses after the duration', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      showToast('bye', 'info', { durationMs: 1000 });
    });
    expect(result.current.toasts).toHaveLength(1);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.toasts).toHaveLength(0);
  });

  it('does not auto-dismiss when durationMs is 0', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      showToast('sticky', 'info', { durationMs: 0 });
    });
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(result.current.toasts).toHaveLength(1);
  });
});

describe('dismissToast', () => {
  it('removes the toast with the given id', () => {
    const { result } = renderHook(() => useToast());
    let id = '';
    act(() => {
      id = showToast('removable', 'info');
    });
    expect(result.current.toasts).toHaveLength(1);
    act(() => {
      dismissToast(id);
    });
    expect(result.current.toasts).toHaveLength(0);
  });

  it('cancels the pending auto-dismiss timer', () => {
    const { result } = renderHook(() => useToast());
    let id = '';
    act(() => {
      id = showToast('toast', 'info', { durationMs: 5000 });
    });
    act(() => {
      dismissToast(id);
    });
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(result.current.toasts).toHaveLength(0);
  });
});

describe('queue behavior', () => {
  it('dedups toasts with the same (tone, message)', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      showToast('Same', 'error');
      showToast('Same', 'error');
      showToast('Same', 'error');
    });
    expect(result.current.toasts).toHaveLength(1);
  });

  it('does not dedup across tones', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      showToast('Same', 'info');
      showToast('Same', 'error');
    });
    expect(result.current.toasts).toHaveLength(2);
  });

  it('caps visible toasts at 3 and reports overflow', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      showToast('one', 'info');
      showToast('two', 'info');
      showToast('three', 'info');
      showToast('four', 'info');
      showToast('five', 'info');
    });
    expect(result.current.toasts).toHaveLength(3);
    expect(result.current.overflow).toBe(2);
  });

  it('keeps the newest toasts visible when overflowing', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      showToast('one', 'info');
      showToast('two', 'info');
      showToast('three', 'info');
      showToast('four', 'info');
    });
    const messages = result.current.toasts.map((t) => t.message);
    expect(messages).toEqual(['two', 'three', 'four']);
  });

  it('reports overflow 0 when under the cap', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      showToast('one', 'info');
    });
    expect(result.current.overflow).toBe(0);
  });
});

describe('useToast', () => {
  it('dismiss callback removes the toast', () => {
    const { result } = renderHook(() => useToast());
    let id = '';
    act(() => {
      id = showToast('manual', 'info');
    });
    expect(result.current.toasts).toHaveLength(1);
    act(() => {
      result.current.dismiss(id);
    });
    expect(result.current.toasts).toHaveLength(0);
  });

  it('subscribes new hooks to future toasts', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      showToast('first', 'info');
    });
    expect(result.current.toasts).toHaveLength(1);
    act(() => {
      showToast('second', 'info');
    });
    expect(result.current.toasts).toHaveLength(2);
  });
});
