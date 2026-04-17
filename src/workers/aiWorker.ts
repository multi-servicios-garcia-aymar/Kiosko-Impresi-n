import { removeBackground } from '@imgly/background-removal';

self.onmessage = async (e: MessageEvent) => {
  const { photoUrl } = e.data;
  
  try {
    const blob = await removeBackground(photoUrl, {
      progress: (key, current, total) => {
        self.postMessage({ type: 'progress', data: { key, current, total } });
      }
    });
    
    self.postMessage({ type: 'success', data: blob });
  } catch (error) {
    let message = 'Unknown Error';
    if (error instanceof Error) message = error.message;
    self.postMessage({ type: 'error', error: message });
  }
};
