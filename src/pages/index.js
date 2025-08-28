import { useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  useEffect(() => {
    // Redirigir directamente a index.html
    window.location.href = '/index.html';
  }, []);

  return (
    <>
      <Head>
        <title>Multifamiliar Tools</title>
        <meta name="description" content="Sistema de herramientas administrativas y operativas para Multifamiliar" />
      </Head>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Arial, sans-serif',
        background: '#0f0f0f',
        color: '#ffffff'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1>Multifamiliar Tools</h1>
          <p>Redirigiendo a la aplicación principal...</p>
          <div style={{ marginTop: '20px' }}>
            <a 
              href="/index.html" 
              style={{ 
                color: '#007bff', 
                textDecoration: 'none',
                padding: '10px 20px',
                border: '1px solid #007bff',
                borderRadius: '5px'
              }}
            >
              Ir directamente
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
