# @narrativeos/ui

Shared account menu, account client, session hook, administrator link, icons, styles, translations and compact brand asset. Extracted from the existing Forge account menu; popovers continue to use Radix UI.

The source of truth is `linchangWeb/packages/narrativeos-ui`. Change this package instead of copying components into either app. Each app retains its API and navigation adapter. No Next.js dependency is required by the shared code.

The portal consumes `file:packages/narrativeos-ui`. Forge consumes an npm archive under `forge_frontend_next/vendor`, so independent Docker builds never need a sibling checkout or access to a private package registry.

To release a change, bump this package's version, then run from this directory:

```powershell
npm pack --pack-destination C:/SelfCreated/MyProject/workwithflynt/engine_skeleton/forge_frontend_next/vendor
```

In `forge_frontend_next`, run `npm install ./vendor/narrativeos-ui-<version>.tgz`, commit the archive, package manifest and lockfile together, and validate both apps. The npm lockfile pins the archive's integrity. The archive is a distribution artifact, not a second editable implementation.

Both Next.js apps must list `@narrativeos/ui` in `transpilePackages` and import `@narrativeos/ui/styles.css` before their app CSS. React and Radix are peer dependencies resolved by the consuming app.

`./collection-card` exports CollectionCard and CardAction. Cards share surface, hover and focus styles; optional actions enable right-click, Shift+F10 and a visible more button. Callers supply links or existing business callbacks and filter actions by ownership. Editable fields retain their native context menu.

## Migration stage 1: verified releases

Before packing, bump the version and run `npm run release:manifest` in this package.
`npm pack` refuses a mismatched manifest. Both applications validate the installed
release before their production build. Hashes normalize text to LF for Windows/Linux.
The portal CI also compares the previous commit and rejects changed content using
an unchanged or lower version. To compare another baseline use
`node verify-release.cjs --base-ref <git-ref>`.

The manifest binds the package version to its runtime files; it is not a digital
signature and cannot prove that another repository has deployed the same release.
This is the first migration stage, pending a single-source workspace.
