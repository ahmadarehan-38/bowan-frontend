import { createContext, useCallback, useContext, useState } from 'react';
import { Check, CircleAlert, X } from 'lucide-react';

const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const notify = useCallback((message, type = 'success') => {
    setToast({ message, type, key: Date.now() });
    window.clearTimeout(window.__bowanToastTimer);
    window.__bowanToastTimer = window.setTimeout(() => setToast(null), 3600);
  }, []);
  return (
    <ToastContext.Provider value={notify}>
      {children}
      {toast && <div className={`toast toast-${toast.type}`} role="status">
        <span className="toast-icon">{toast.type === 'error' ? <CircleAlert size={17} /> : <Check size={17} />}</span>
        <span>{toast.message}</span>
        <button type="button" aria-label="Dismiss notification" onClick={() => setToast(null)}><X size={16} /></button>
      </div>}
    </ToastContext.Provider>
  );
}

export function useToast() { return useContext(ToastContext); }
