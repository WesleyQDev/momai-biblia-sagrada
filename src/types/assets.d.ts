// Asset imports bundled by esbuild/vite as URLs (see build.mjs loaders).
declare module '*.png' {
  const url: string
  export default url
}

declare module '*.jpg' {
  const url: string
  export default url
}
