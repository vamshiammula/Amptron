// Set before importing Vite: shell environments must not ship React development code.
process.env.NODE_ENV = 'production'
const { build } = await import('vite')
await build({
  mode: 'production',
  plugins: [
    {
      name: 'production-runtime-check',
      generateBundle(_options, bundle) {
        for (const output of Object.values(bundle)) {
          if (output.type !== 'chunk') continue
          if (
            Object.keys(output.modules).some((id) =>
              /(?:react|react-dom|scheduler).*\.development\.js/.test(id),
            )
          ) {
            throw new Error('Development React runtime found in production output.')
          }
        }
      },
    },
  ],
})
