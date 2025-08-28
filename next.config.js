/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración básica
  reactStrictMode: true,
  swcMinify: true,
  
  // Configuración para servir archivos estáticos
  async rewrites() {
    return [
      // Servir archivos HTML estáticos directamente desde la raíz
      {
        source: '/(.*\\.html)',
        destination: '/$1',
      },
      // Para cualquier otra ruta, redirigir a index.html (SPA behavior)
      {
        source: '/(.*)',
        destination: '/index.html',
      },
    ];
  },
  
  // Headers para CORS
  async headers() {
    return [
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type',
          },
        ],
      },
    ];
  },
  
  // Configuración adicional
  trailingSlash: false,
  generateEtags: false,
};

module.exports = nextConfig;
