# swcMinify issue with react-hook-form and turborepo

Minification ends up creating the same variable twice, once as a `var` and secondly as a `let`, in the same scope, one close to the other.

This error started with `next@v13.1.7-canary.9` more information here: https://github.com/avitorio/outstatic/issues/109

Main directories:
`/apps/dev`: Next.js install using outstatic package
`/packages/outstatic`: The outstatic package

## Steps to reproduce the error

- Clone the repository
- Run `pnpm install`
- Run `pnpm build --filter outstatic`
- Go to `/apps/dev`
- Run `pnpm build && pnpm start`
- Visit `http://localhost:3000/outstatic`

Check the console, you should see this error:
`Uncaught SyntaxError: Identifier `eo` has already been declared`

The error seems to happen in this line of react-hook-form: https://github.com/react-hook-form/react-hook-form/blob/27ac86d4819a0a231a9669317c62649d8f65d27d/src/logic/createFormControl.ts#L984C11-L984C11

The variable `fieldRef` is minified but declared twice. Minified it looks like this, in this case `eo`:

`ref:eu=>{if(eu){var eo;eX(et,en),ei=eg(ea,et);let eo=ey(eu.value)`

The error can be suppressed by not using `react-hook-form`'s `useFormContext`.
In this example repo this is found at `packages/outstatic/src/pages/index.tsx`

It can also be fixed by setting `swcMinify: false` on `next.config.js`
