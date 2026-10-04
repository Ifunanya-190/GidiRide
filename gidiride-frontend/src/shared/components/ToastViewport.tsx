import { useEffect, useState } from 'react';

type ToastTone = 'success' | 'warning' | 'danger' | 'neutral';
interface ToastItem {
  id: string;
  title: string;
  body?: string;
  tone: ToastTone;
}

export function notify(title: string, body?: string, tone: ToastTone = 'neutral') {
  window.dispatchEvent(new CustomEvent('gidiride:toast', { detail: { title, body, tone } }));
}

export function ToastViewport() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    function push(detail: Omit<ToastItem, 'id'>) {
      const item: ToastItem = { id: crypto.randomUUID(), ...detail };
      setItems((current) => [item, ...current].slice(0, 4));
      window.setTimeout(() => {
        setItems((current) => current.filter((toast) => toast.id !== item.id));
      }, 4200);
    }

    const onToast = (event: Event) => {
      const detail = (event as CustomEvent<Omit<ToastItem, 'id'>>).detail;
      push(detail);
    };

    const onRideEvent = (event: Event) => {
      const detail = (event as CustomEvent<{ title: string; body: string; tone?: string }>).detail;
      push({
        title: detail.title,
        body: detail.body,
        tone: detail.tone === 'red' ? 'danger' : detail.tone === 'yellow' ? 'warning' : detail.tone === 'green' ? 'success' : 'neutral'
      });
    };

    window.addEventListener('gidiride:toast', onToast);
    window.addEventListener('gidiride:ride-event', onRideEvent);
    return () => {
      window.removeEventListener('gidiride:toast', onToast);
      window.removeEventListener('gidiride:ride-event', onRideEvent);
    };
  }, []);

  return (
    <div className="toast-viewport" aria-live="polite" aria-atomic="true">
      {items.map((item) => (
        <div key={item.id} className={`toast-card ${item.tone}`}>
          <strong>{item.title}</strong>
          {item.body && <small>{item.body}</small>}
          <button onClick={() => setItems((current) => current.filter((toast) => toast.id !== item.id))}>×</button>
        </div>
      ))}
    </div>
  );
}
