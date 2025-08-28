import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirigir a la aplicación principal
    router.push('/index.html');
  }, [router]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div>
        <h1>Multifamiliar Tools</h1>
        <p>Redirigiendo a la aplicación principal...</p>
      </div>
    </div>
  );
}
