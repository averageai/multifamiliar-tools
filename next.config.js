/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
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
  async rewrites() {
    return [
      // Redirigir la raíz a index.html
      {
        source: '/',
        destination: '/index.html',
      },
      // Servir archivos HTML estáticos directamente
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
  trailingSlash: false,
  generateEtags: false,
};

module.exports = nextConfig;
