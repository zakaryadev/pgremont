import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw } from 'lucide-react';

export function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      setDeferredPrompt(null);
      setShowInstallButton(false);
    }
  };

  const handleUpdateClick = () => {
    updateServiceWorker(true);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {showInstallButton && (
        <Button
          onClick={handleInstallClick}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
          size="sm"
        >
          <Download className="w-4 h-4 mr-2" />
          Install App
        </Button>
      )}
      
      {needRefresh && (
        <Button
          onClick={handleUpdateClick}
          className="bg-green-600 hover:bg-green-700 text-white shadow-lg"
          size="sm"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Update Available
        </Button>
      )}
    </div>
  );
}
