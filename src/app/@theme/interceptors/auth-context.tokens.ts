import { HttpContextToken } from '@angular/common/http';

// Permite que llamadas puntuales manejen un 401 de forma local sin forzar logout global.
export const SKIP_AUTH_401_REDIRECT = new HttpContextToken<boolean>(() => false);
