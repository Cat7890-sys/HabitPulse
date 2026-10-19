import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AuthProvider } from './auth/AuthContext';
import { testConnection } from './lib/firebase';

// Validate connection to Firestore on initial boot as per skill instructions
testConnection();

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  );
}
