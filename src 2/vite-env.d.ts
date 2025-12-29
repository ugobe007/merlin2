/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_OPENAI_API_KEY?: string
  readonly VITE_ADMIN_EMAIL?: string
  readonly VITE_ADMIN_PASSWORD?: string
  readonly VITE_ADMIN_ACCOUNTS?: string
  readonly VITE_LOG_ENDPOINT?: string
  readonly DEV: boolean
  readonly PROD: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
