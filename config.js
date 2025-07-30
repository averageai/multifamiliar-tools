// config.js - Configuración con variables de entorno
class Config {
    constructor() {
        // Variables de entorno (en Vercel se configuran en el dashboard)
        this.JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
        this.NODE_ENV = process.env.NODE_ENV || 'development';
        
        // Credenciales desde variables de entorno
        this.credentials = {
            'admin': {
                password: process.env.ADMIN_PASSWORD || 'admin123',
                name: 'Administrador',
                role: 'admin',
                permissions: ['inventarios', 'precios']
            },
            'operativo': {
                password: process.env.OPERATIVO_PASSWORD || 'operativo123',
                name: 'Operativo',
                role: 'operativo',
                permissions: ['precios']
            },
            'usuario': {
                password: process.env.USUARIO_PASSWORD || 'usuario123',
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
        const user = this.credentials[username];
        if (user && user.password === password) {
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
            hasJWTSecret: !!this.JWT_SECRET && this.JWT_SECRET !== 'fallback-secret-key',
            totalUsers: Object.keys(this.credentials).length
        };
    }
}

// Exportar para uso global
window.Config = Config; 