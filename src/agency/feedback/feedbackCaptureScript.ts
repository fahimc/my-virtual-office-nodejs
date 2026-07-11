export const feedbackCaptureScript = `
(() => {
  window.__agencyFeedbackCapture = {
    version: 'local-overlay-v1',
    sanitize(value) {
      return String(value || '').replace(/[<>]/g, '').slice(0, 2000);
    }
  };
})();
`;
