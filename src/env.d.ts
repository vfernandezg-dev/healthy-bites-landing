interface ImportMetaEnv {
  /** URL del web-app (Angular) donde viven el login y el registro. */
  readonly PUBLIC_APP_URL?: string;
  /** URL base de la API REST (healthybites-backend), p. ej. http://localhost:8090/api/v1 */
  readonly PUBLIC_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
