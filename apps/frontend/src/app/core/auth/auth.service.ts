import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

interface LoginPayload {
  email: string;
  password: string;
}

interface LoginResponseData {
  token?: string | null;
  expiresAt?: string | null;
  email?: string | null;
  name?: string | null;
  roles?: string[] | null;
}

interface ApiResponse<T> {
  success?: boolean;
  message?: string | null;
  data?: T | null;
  errors?: string[] | null;
}

interface LoginSessionInfo {
  token: string;
  expiresAt: string | null;
}

export interface ChangePasswordPayload {
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface UserProfile {
  name: string;
  email: string;
  roles: string[];
  loggedAt: string | null;
}

interface SessionData {
  email: string;
  token: string;
  loggedAt: string;
  expiresAt?: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly adminLikeRoles = ['admin', 'editor'];
  private readonly adminLikeRoleIds = [1, 2];
  private readonly ordersAccessRoles = ['admin', 'editor', 'administrador', 'administrativo'];
  private readonly usersManagementEmails = ['201521216@urp.edu.pe', 'molinaz.dev@gmail.com'];
  private readonly loginUrl = `/api/v1/auth/login`;
  private readonly changePasswordUrl = `/api/v1/auth/change-password`;
  private readonly forgotPasswordUrl = `/api/v1/auth/forgot-password`;
  private readonly sessionStorageKey = 'session';

  constructor(private http: HttpClient) {}

  login(payload: LoginPayload): Observable<string> {
    return this.http
      .post<unknown>(this.loginUrl, payload)
      .pipe(
        map((response) => this.extractLoginSession(response)),
        tap((sessionInfo) => this.saveSession(payload.email, sessionInfo)),
        map((sessionInfo) => sessionInfo.token),
      );
  }

  forgotPassword(payload: ForgotPasswordPayload): Observable<unknown> {
    return this.http.post<unknown>(this.forgotPasswordUrl, payload);
  }

  isAuthenticated(): boolean {
    return Boolean(this.getToken());
  }

  getUserProfile(): UserProfile | null {
    const session = this.getSession();
    if (!session) {
      return null;
    }

    const payload = this.decodeTokenPayload(session.token);
    const name =
      this.asString(payload?.['name'])
      ?? this.asString(payload?.['unique_name'])
      ?? this.asString(payload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'])
      ?? 'Usuario';
    const email =
      session.email
      || this.asString(payload?.['email'])
      || this.asString(payload?.['unique_name'])
      || this.asString(payload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'])
      || '-';

    return {
      name,
      email,
      roles: this.extractRoles(payload),
      loggedAt: session.loggedAt ?? null,
    };
  }

  changePassword(payload: ChangePasswordPayload): Observable<unknown> {
    return this.http.post<unknown>(this.changePasswordUrl, payload, {
      headers: this.authHeaders(),
    });
  }

  isAdmin(): boolean {
    return this.hasAnyRole(this.adminLikeRoles, this.adminLikeRoleIds);
  }

  canManageMembers(): boolean {
    return this.getBooleanClaim(['geo_can_access_members']);
  }

  canManageUsers(): boolean {
    return this.getBooleanClaim(['geo_can_access_users']) || this.isUsersManagementEmail();
  }

  canAccessOrders(): boolean {
    return this.hasAnyRoleName(this.ordersAccessRoles);
  }

  canManageOrders(): boolean {
    return this.canAccessOrders();
  }

  getToken(): string | null {
    const session = this.getSession();
    return session?.token ?? null;
  }

  getRoleId(): number | null {
    const token = this.getToken();

    if (!token) {
      return null;
    }

    const payload = this.decodeTokenPayload(token);
    const roleValue =
      payload?.['roleId']
      ?? payload?.['role']
      ?? payload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

    const roleId = Number(roleValue);
    return Number.isNaN(roleId) ? null : roleId;
  }

  logout(): void {
    localStorage.removeItem(this.sessionStorageKey);
  }

  private saveSession(email: string, sessionInfo: LoginSessionInfo): void {
    const session: SessionData = {
      email,
      token: sessionInfo.token,
      loggedAt: new Date().toISOString(),
      expiresAt: sessionInfo.expiresAt,
    };

    localStorage.setItem(this.sessionStorageKey, JSON.stringify(session));
  }

  private getSession(): SessionData | null {
    const storedSession = localStorage.getItem(this.sessionStorageKey);

    if (!storedSession) {
      return null;
    }

    try {
      const session = JSON.parse(storedSession) as SessionData;
      if (this.isSessionExpired(session)) {
        this.logout();
        return null;
      }

      return session;
    } catch {
      this.logout();
      return null;
    }
  }

  private decodeTokenPayload(token: string): Record<string, unknown> | null {
    const parts = token.split('.');

    if (parts.length < 2) {
      return null;
    }

    try {
      const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const decoded = atob(payload);
      return JSON.parse(decoded) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private authHeaders(): HttpHeaders {
    const token = this.getToken() ?? '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  private extractLoginSession(response: unknown): LoginSessionInfo {
    if (typeof response === 'string') {
      const token = response.trim();
      if (token) {
        return {
          token,
          expiresAt: null,
        };
      }
    }

    if (!this.isRecord(response)) {
      throw new Error('No se pudo iniciar sesion.');
    }

    const apiResponse = response as ApiResponse<LoginResponseData>;
    const message = this.asString(apiResponse.message);
    const firstError = Array.isArray(apiResponse.errors) ? this.asString(apiResponse.errors[0]) : undefined;

    if (apiResponse.success === false) {
      throw new Error(message ?? firstError ?? 'Credenciales invalidas.');
    }

    const token =
      this.asString(apiResponse.data?.token)
      ?? this.asString(response['token']);
    const expiresAt =
      this.asString(apiResponse.data?.expiresAt)
      ?? this.asString(response['expiresAt'])
      ?? null;

    if (token?.trim()) {
      return {
        token: token.trim(),
        expiresAt,
      };
    }

    throw new Error(message ?? firstError ?? 'Credenciales invalidas.');
  }

  private extractRoles(payload: Record<string, unknown> | null): string[] {
    if (!payload) {
      return [];
    }

    const rawRoles =
      payload['roles']
      ?? payload['role']
      ?? payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

    if (Array.isArray(rawRoles)) {
      return rawRoles
        .map((role) => this.asString(role) ?? String(role))
        .map((role) => role.trim())
        .filter((role) => role.length > 0);
    }

    if (typeof rawRoles === 'number') {
      return [String(rawRoles)];
    }

    const oneRole = this.asString(rawRoles);
    return oneRole?.trim() ? [oneRole.trim()] : [];
  }

  private isSessionExpired(session: SessionData): boolean {
    const expiresAtMs = this.parseExpiresAtMs(session.expiresAt);
    if (expiresAtMs !== null) {
      return Date.now() >= expiresAtMs;
    }

    const tokenExpMs = this.extractTokenExpirationMs(session.token);
    if (tokenExpMs !== null) {
      return Date.now() >= tokenExpMs;
    }

    return false;
  }

  private parseExpiresAtMs(expiresAt: string | null | undefined): number | null {
    if (!expiresAt) {
      return null;
    }

    const parsed = Date.parse(expiresAt);
    return Number.isNaN(parsed) ? null : parsed;
  }

  private extractTokenExpirationMs(token: string): number | null {
    const payload = this.decodeTokenPayload(token);
    if (!payload) {
      return null;
    }

    const exp = payload['exp'];
    if (typeof exp === 'number' && Number.isFinite(exp)) {
      return exp > 1e12 ? exp : exp * 1000;
    }

    if (typeof exp === 'string' && exp.trim()) {
      const numeric = Number(exp);
      if (!Number.isNaN(numeric)) {
        return numeric > 1e12 ? numeric : numeric * 1000;
      }

      const parsedDate = Date.parse(exp);
      return Number.isNaN(parsedDate) ? null : parsedDate;
    }

    return null;
  }

  private hasAnyRole(targetRoles: string[], targetRoleIds: number[]): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    const payload = this.decodeTokenPayload(token);
    if (!payload) {
      return false;
    }

    const normalizedTargets = targetRoles.map((role) => role.toLowerCase());
    const roles = this.extractRoles(payload).map((role) => role.toLowerCase());
    if (roles.some((role) => normalizedTargets.includes(role))) {
      return true;
    }

    const roleId = this.getRoleId();
    if (roleId !== null && targetRoleIds.includes(roleId)) {
      return true;
    }

    if (roles.some((role) => targetRoleIds.includes(Number(role)))) {
      return true;
    }

    return false;
  }

  private hasAnyRoleName(targetRoles: string[]): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    const payload = this.decodeTokenPayload(token);
    if (!payload) {
      return false;
    }

    const normalizedTargets = targetRoles.map((role) => role.toLowerCase());
    const roles = this.extractRoles(payload).map((role) => role.toLowerCase());
    return roles.some((role) => normalizedTargets.includes(role));
  }

  private getBooleanClaim(claimNames: string[]): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    const payload = this.decodeTokenPayload(token);
    if (!payload) {
      return false;
    }

    for (const claimName of claimNames) {
      const value = payload[claimName];

      if (typeof value === 'boolean') {
        return value;
      }

      if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (normalized === 'true') {
          return true;
        }

        if (normalized === 'false') {
          return false;
        }
      }

      if (typeof value === 'number') {
        return value === 1;
      }
    }

    return false;
  }

  private isUsersManagementEmail(): boolean {
    const email = this.getCurrentEmail();
    return this.usersManagementEmails.includes(email);
  }

  private getCurrentEmail(): string {
    const profile = this.getUserProfile();
    return profile?.email?.trim().toLowerCase() ?? '';
  }

  private asString(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
