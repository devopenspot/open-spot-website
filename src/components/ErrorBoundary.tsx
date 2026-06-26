import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface State {
  error: Error | null;
}

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught', error, info);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  handleReload = () => {
    if (typeof window !== 'undefined') window.location.reload();
  };

  override render() {
    if (this.state.error) {
      return (
        <div
          role="alert"
          className="mx-auto my-12 max-w-md rounded-2xl border border-outline-variant bg-surface-bright p-6 text-center"
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-outline-variant text-error">
            <AlertTriangle size={20} aria-hidden="true" />
          </div>
          <h2 className="font-display text-base font-bold uppercase tracking-wider text-on-surface">
            {this.props.fallbackTitle ?? 'Something went wrong'}
          </h2>
          <p className="mt-2 text-xs text-secondary leading-relaxed">
            An unexpected error occurred while rendering this view. The rest of the app is still safe to use.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="rounded-lg bg-on-surface text-surface px-4 py-2 text-xs font-bold tracking-widest uppercase hover:bg-on-surface/90 transition-all"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={this.handleReload}
              className="rounded-lg border border-outline text-on-surface px-4 py-2 text-xs font-bold tracking-widest uppercase hover:bg-surface-container transition-all"
            >
              Reload app
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
