// config.js - Configuración con variables de entorno
class Config {
    constructor() {
        // Configuración de entorno
        this.NODE_ENV = 'production'; // Cambiar a 'development' para desarrollo local
        
        // Credenciales configuradas para Vercel
        this.credentials = {
            'admin': {
                password: 'Multifamiliar*1', // Configurado en Vercel
                name: 'Administrador',
                role: 'admin',
                permissions: ['inventarios', 'precios']
            },
            'operativo': {
                password: 'Multifamiliar*1', // Configurado en Vercel
                name: 'Operativo',
                role: 'operativo',
                permissions: ['precios']
            },
            'usuario': {
                password: 'Ventas123', // Configurado en Vercel
                name: 'Usuario',
                role: 'usuario',
                permissions: ['inventarios']
            }
        };
    }

    // Verificar si estamos en producción
    isProduction() {
        return this.NODE_ENV === 'production';
    }

    // Obtener credenciales
    getCredentials() {
        return this.credentials;
    }

    // Verificar credenciales
    authenticate(username, password) {
        console.log('🔍 Verificando credenciales para:', username);
        console.log('📋 Credenciales disponibles:', Object.keys(this.credentials));
        
        const user = this.credentials[username];
        console.log('👤 Usuario encontrado:', user);
        
        if (user && user.password === password) {
            console.log('✅ Contraseña correcta');
            return {
                success: true,
                user: {
                    username,
                    name: user.name,
                    role: user.role,
                    permissions: user.permissions
                }
            };
        }
        console.log('❌ Contraseña incorrecta o usuario no encontrado');
        return { success: false, message: 'Credenciales inválidas' };
    }

    // Verificar permisos
    hasPermission(username, tool) {
        const user = this.credentials[username];
        return user && user.permissions.includes(tool);
    }

    // Generar token de sesión simple
    generateSessionToken(username) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2);
        const data = `${username}:${timestamp}:${random}`;
        return btoa(data);
    }

    // Verificar token de sesión
    verifySessionToken(token) {
        try {
            const decoded = atob(token);
            const [username, timestamp, random] = decoded.split(':');
            
            if (this.credentials[username]) {
                const sessionAge = Date.now() - parseInt(timestamp);
                // Sesión válida por 8 horas
                if (sessionAge < 8 * 60 * 60 * 1000) {
                    return {
                        valid: true,
                        username,
                        user: this.credentials[username]
                    };
                }
            }
        } catch (e) {
            console.error('Error verificando token:', e);
        }
        return { valid: false };
    }

    // Obtener información de configuración (sin exponer credenciales)
    getConfigInfo() {
        return {
            environment: this.NODE_ENV,
            isProduction: this.isProduction(),
            totalUsers: Object.keys(this.credentials).length,
            version: '1.0.0'
        };
    }
}

// Exportar para uso global
window.Config = Config; 

// Configuración de rutas según el entorno
const config = {
    // Detectar si estamos en producción (Vercel) o desarrollo local
    isProduction: window.location.hostname === 'tools.average.lat',
    
    // Rutas base para archivos Excel
    getBasePath: function() {
        return this.isProduction ? '/bases_datos/' : 'bases_datos/';
    },
    
    // Obtener ruta completa para un archivo
    getFilePath: function(filename) {
        return this.getBasePath() + filename;
    },
    
    // Configuración de sedes
    sedes: {
        manizales: {
            nombre: 'Manizales',
            archivo: 'https://raw.githubusercontent.com/averageai/files-source/main/productos_manizales.xlsx',
            icon: '🏪',
            color: '#28a745'
        },
        dorada: {
            nombre: 'Dorada',
            archivo: 'https://raw.githubusercontent.com/averageai/files-source/main/productos_dorada.xlsx',
            icon: '🏬',
            color: '#3498db'
        }
    }
};

// Función para obtener la configuración de una sede
function getSedeConfig(sede) {
    const sedeConfig = config.sedes[sede];
    if (!sedeConfig) {
        throw new Error(`Sede '${sede}' no encontrada`);
    }
    
    return sedeConfig;
}

// Exportar para uso en otros archivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { config, getSedeConfig };
} 