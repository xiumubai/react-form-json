/// <reference types="vite/client" />

declare module '*.json' {
  const value: any;
  export default value;
}

declare module '*.yaml' {
  const value: any;
  export default value;
}

declare module '*.yml' {
  const value: any;
  export default value;
}