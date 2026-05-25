import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config'; // Este es el que tiene la configuración buena
import { App } from './app/app';

import { environment } from './environments/environment';

console.log('API URL:', environment.apiUrl);
console.log('Production:', environment.production);

bootstrapApplication(App, appConfig) // <--- PASA DIRECTAMENTE EL appConfig
  .catch((err) => console.error(err));
