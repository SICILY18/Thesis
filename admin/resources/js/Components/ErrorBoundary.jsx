import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-4 rounded-lg bg-red-50 text-red-800">
                    <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
                    <p className="mb-4">Don't worry, your data is safe. Please try refreshing the page.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200"
                    >
                        Refresh Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;