import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { AppRoutingModule } from './app/app-routing.module';
import { AppComponent } from './app/app.component';
import { importProvidersFrom } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { authInterceptor } from './app/@theme/interceptors/auth.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(BrowserModule, AppRoutingModule),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations()
  ]
}).catch((err) => console.error(err));
