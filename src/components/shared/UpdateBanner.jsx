import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export default function UpdateBanner() {
  const [show, setShow] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      // Check for updates periodically
      if (r) {
        setInterval(() => {
          r.update();
        }, 60 * 60 * 1000); // hourly
      }
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    }
  });

  useEffect(() => {
    if (needRefresh) setShow(true);
  }, [needRefresh]);

  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto z-50 card-fantasy card-fantasy-gold max-w-md animate-slide-up">
      <p className="text-text mb-3 font-display">📜 גרסה חדשה זמינה!</p>
      <div className="flex gap-2">
        <button
          onClick={() => updateServiceWorker(true)}
          className="btn-gold flex-1"
        >
          עדכן עכשיו
        </button>
        <button
          onClick={() => {
            setShow(false);
            setNeedRefresh(false);
          }}
          className="btn-ghost"
        >
          לא עכשיו
        </button>
      </div>
    </div>
  );
}
