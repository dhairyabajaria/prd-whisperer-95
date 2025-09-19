// Debug component to help diagnose loading issues
import React from 'react';

export function AppDebugger() {
  React.useEffect(() => {
    console.log('🚀 App Debug: React component mounted successfully');
    console.log('🚀 App Debug: Environment:', {
      NODE_ENV: import.meta.env.MODE,
      DEV: import.meta.env.DEV,
      PROD: import.meta.env.PROD,
    });
    
    // Test basic network connectivity
    fetch('/api/health')
      .then(res => {
        console.log('🚀 App Debug: Health check response:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('🚀 App Debug: Health check data:', data);
      })
      .catch(error => {
        console.error('🚀 App Debug: Health check failed:', error);
      });
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '8px',
      fontSize: '12px',
      zIndex: 9999,
      borderRadius: '0 0 0 8px'
    }}>
      🔍 Debug Active
    </div>
  );
}