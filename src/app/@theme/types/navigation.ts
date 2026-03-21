export interface NavigationItem {
  id: string;
  title: string;
  type: 'item' | 'collapse' | 'group';
  translate?: string;
  icon?: string;
  link?: string;
  hidden?: boolean;
  url?: string;
  classes?: string;
  groupClasses?: string;
  exactMatch?: boolean;
  external?: boolean;
  target?: boolean;
  breadcrumbs?: boolean;
  badge?: {
    title?: string;
    type?: string;
  };
  children?: Navigation[];
  /** Roles que pueden ver este item (se verifica el rol ACTIVO) */
  allowedRoles?: string[];
  /**
   * Permisos alternativos: si el usuario tiene CUALQUIERA de estos permisos
   * el item es visible aunque no tenga el rol en allowedRoles.
   */
  requiredPermissions?: { url: string; method: string }[];
}

export interface Navigation extends NavigationItem {
  children?: NavigationItem[];
}
