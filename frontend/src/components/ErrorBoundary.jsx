import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#090a0f] flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="inline-flex p-4 rounded-2xl bg-red-100 dark:bg-red-500/10 text-red-500">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Beklenmeyen Bir Hata Oluştu
              </h1>
              <p className="text-sm text-slate-500 dark:text-gray-400">
                Uygulama beklenmeyen bir durumla karşılaştı. Lütfen sayfayı yenileyerek tekrar deneyiniz.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-500/30 text-left">
                <p className="text-xs text-red-600 dark:text-red-400 font-mono break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-sm transition flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Tekrar Dene
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 rounded-xl bg-slate-200 dark:bg-gray-800 hover:bg-slate-300 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 font-bold text-sm transition"
              >
                Sayfayı Yenile
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
