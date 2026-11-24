import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  errorMessage: string | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { errorMessage: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let message = error.message || 'An unexpected error occurred.';
    try {
      const parsed = JSON.parse(message) as { error?: string; path?: string };
      if (parsed.error) {
        message = parsed.path
          ? `${parsed.error} (${parsed.path})`
          : parsed.error;
      }
    } catch {
      // Plain text error message
    }
    return { errorMessage: message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('PARTHA ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.errorMessage) {
      return (
        <div className="min-h-screen bg-[#FAF7F0] flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-xl border border-[#E5DFD0] bg-[#FFFEFA] p-6 space-y-4">
            <h1 className="font-display text-lg font-bold text-[#18221D]">
              Something went wrong
            </h1>
            <p className="text-xs leading-relaxed text-stone-600">
              {this.state.errorMessage}
            </p>
            <button
              type="button"
              onClick={() => this.setState({ errorMessage: null })}
              className="rounded-lg bg-emerald-800 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-900 cursor-pointer"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
