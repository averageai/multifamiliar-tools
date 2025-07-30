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