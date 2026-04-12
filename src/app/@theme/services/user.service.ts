import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SKIP_AUTH_401_REDIRECT } from '../interceptors/auth-context.tokens';

export interface BackendUser {
  id: string;
  name: string;
  email: string;
  status: boolean;
}

export interface BackendRole {
  id: string;
  name: string;
  description: string;
}

export interface BackendUserRole {
  id: string;
  user: BackendUser;
  role: BackendRole;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private readonly API = environment.apiUrl;

  getUsers(): Observable<BackendUser[]> {
    return this.http.get<BackendUser[]>(`${this.API}/api/users`);
  }

  searchUsers(query: string): Observable<BackendUser[]> {
    return this.http.get<BackendUser[]>(`${this.API}/api/users/search`, { params: { query } });
  }

  getUserById(id: string): Observable<BackendUser> {
    return this.http.get<BackendUser>(`${this.API}/api/users/${id}`);
  }

  createUser(user: { name: string; email: string; password: string }): Observable<BackendUser> {
    return this.http.post<BackendUser>(`${this.API}/api/users`, user);
  }

  updateUser(id: string, user: Partial<BackendUser>): Observable<BackendUser> {
    return this.http.put<BackendUser>(`${this.API}/api/users/${id}`, user);
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API}/api/users/${id}`);
  }

  getRoles(): Observable<BackendRole[]> {
    return this.http.get<BackendRole[]>(`${this.API}/roles`);
  }

  getAllUserRoles(): Observable<BackendUserRole[]> {
    const allowLocal401Handling = new HttpContext().set(SKIP_AUTH_401_REDIRECT, true);
    return this.http.get<BackendUserRole[]>(`${this.API}/user-role`, {
      context: allowLocal401Handling
    });
  }

  getUserRoles(userId: string): Observable<BackendUserRole[]> {
    return this.http.get<BackendUserRole[]>(`${this.API}/user-role/user/${userId}`);
  }

  assignRole(userId: string, roleId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API}/user-role/user/${userId}/role/${roleId}`, {});
  }

  removeRole(userRoleId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API}/user-role/${userRoleId}`);
  }
}
