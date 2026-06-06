import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="card-fantasy card-fantasy-gold max-w-md text-center">
            <h2 className="text-2xl text-gold mb-3 heading-glow">⚠️ משהו השתבש</h2>
            <p className="text-text/80 mb-4">
              אירעה שגיאה בלתי צפויה. נסה לרענן את הדף.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-gold"
            >
              רענן דף
            </button>
            {import.meta.env.DEV && (
              <pre className="mt-4 text-xs text-danger/80 text-right overflow-auto max-h-32">
                {this.state.error?.message}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
