/// <reference types="vite/client" />

interface ImportMetaEnv {
    VITE_REST_API_BASE: string;
    VITE_GRAPHQL_API_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
