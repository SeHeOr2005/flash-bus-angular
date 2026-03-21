import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { BackendRole } from './user.service';

export interface BackendPermission {
  id: string;
  url: string;
  method: string;
  model: string;
}

export interface BackendRolePermission {
  id: string;
  role: BackendRole;
  permission: BackendPermission;
}

@Injectable({ providedIn: 'root' })
export class RoleService {
  private http = inject(HttpClient);
  private readonly API = environment.apiUrl;

  // ── Roles ──────────────────────────────────────────────────────────────────
  getRoles(): Observable<BackendRole[]> {
    return this.http.get<BackendRole[]>(`${this.API}/roles`);
  }

  getRoleById(id: string): Observable<BackendRole> {
    return this.http.get<BackendRole>(`${this.API}/roles/${id}`);
  }

  createRole(role: { name: string; description: string }): Observable<BackendRole> {
    return this.http.post<BackendRole>(`${this.API}/roles`, role);
  }

  updateRole(id: string, role: { name: string; description: string }): Observable<BackendRole> {
    return this.http.put<BackendRole>(`${this.API}/roles/${id}`, role);
  }

  deleteRole(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API}/roles/${id}`);
  }

  // ── Permisos ───────────────────────────────────────────────────────────────
  getPermissions(): Observable<BackendPermission[]> {
    return this.http.get<BackendPermission[]>(`${this.API}/permissions`);
  }

  getPermissionById(id: string): Observable<BackendPermission> {
    return this.http.get<BackendPermission>(`${this.API}/permissions/${id}`);
  }

  createPermission(permission: { url: string; method: string; model: string }): Observable<BackendPermission> {
    return this.http.post<BackendPermission>(`${this.API}/permissions`, permission);
  }

  updatePermission(id: string, permission: { url: string; method: string; model: string }): Observable<BackendPermission> {
    return this.http.put<BackendPermission>(`${this.API}/permissions/${id}`, permission);
  }

  deletePermission(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API}/permissions/${id}`);
  }

  // ── Permisos de un Rol ─────────────────────────────────────────────────────
  getRolePermissions(roleId: string): Observable<BackendRolePermission[]> {
    return this.http.get<BackendRolePermission[]>(`${this.API}/role-permission/role/${roleId}`);
  }

  assignPermissionToRole(roleId: string, permissionId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API}/role-permission/role/${roleId}/permission/${permissionId}`, {});
  }

  removePermissionFromRole(rolePermissionId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API}/role-permission/${rolePermissionId}`);
  }
}
