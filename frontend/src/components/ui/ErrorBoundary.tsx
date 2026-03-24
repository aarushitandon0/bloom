// ── Error boundary — catches render crashes ─────────────────

import { Component, type ReactNode } from 'react';
import { Flower2, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-dvh flex flex-col items-center justify-center bg-parchment px-6 gap-4">
          <Flower2 size={48} className="text-latte/60" />
          <h1
            className="text-xl text-ink font-bold text-center"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            something went wrong
          </h1>
          <p
            className="text-sm text-ink/50 text-center max-w-xs leading-relaxed"
            style={{ fontFamily: 'var(--font-journal)' }}
          >
            your garden data is safe — try refreshing the page.
          </p>
          {this.state.error && (
            <pre className="text-[10px] text-ink/25 max-w-xs overflow-auto text-center">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                       bg-sage text-cream font-display font-bold text-sm
                       hover:bg-sage/90 transition-colors"
          >
            <RefreshCw size={15} />
            refresh
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
