// Type shim for the `disposable-email-domains` npm package.
//
// The upstream package ships its main entry as a plain JSON array
// (`main: "./index.json"`) and does not publish any TypeScript types. With
// `resolveJsonModule: true` and `moduleResolution: "bundler"`, TS would
// otherwise infer the import as a JSON literal — this shim declares the
// minimal shape (a default-exported string array) so we get clean typing
// without `any` or @ts-* escapes.

declare module "disposable-email-domains" {
  const domains: readonly string[];
  export default domains;
}
