import { useEffect } from 'react';

declare global {
  interface Window {
    Redoc: any;
  }
}

const ApiDocs = () => {
  useEffect(() => {
    // Load Redoc script dynamically
    const script = document.createElement('script');
    script.src = 'https://cdn.redoc.ly/redoc/v2.0.0/bundles/redoc.standalone.js';
    script.onload = () => {
      if (window.Redoc) {
        window.Redoc.init('/api/openapi.json', {
          scrollYOffset: 60,
          hideDownloadButton: false,
          theme: {
            colors: {
              primary: {
                main: '#2E57F6'
              },
              success: {
                main: '#63D581'  
              }
            },
            typography: {
              fontFamily: 'Ubuntu, system-ui, sans-serif',
              headings: {
                fontFamily: 'Poppins, system-ui, sans-serif'
              }
            },
            sidebar: {
              backgroundColor: '#F5F7FA',
              textColor: '#2c3e50'
            },
            rightPanel: {
              backgroundColor: '#1e293b'
            }
          },
          expandResponses: '200,201',
          jsonSampleExpandLevel: 2,
          hideHostname: false,
          pathInMiddlePanel: true,
          menuToggle: true,
          search: true,
          sortPropsAlphabetically: true,
          payloadSampleIdx: 0
        }, document.getElementById('redoc-container'));
      }
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen">
      <div id="redoc-container"></div>
    </div>
  );
};

export default ApiDocs;