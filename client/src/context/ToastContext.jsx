import { createContext, useCallback, useContext, useState } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';

const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const notify = useCallback((message, variant = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((list) => [...list, { id, message, variant }]);
  }, []);

  const dismiss = (id) => setToasts((list) => list.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <ToastContainer position="bottom-end" containerPosition="fixed" className="p-3">
        {toasts.map((t) => (
          <Toast key={t.id} bg={t.variant} onClose={() => dismiss(t.id)} delay={3000} autohide>
            <Toast.Body className={t.variant === 'warning' || t.variant === 'light' ? '' : 'text-white'}>{t.message}</Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
