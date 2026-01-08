module.exports = {
  preset: 'jest-expo',
  collectCoverage: false,
  collectCoverageFrom: [
    '{components,domain,infra}/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/*.config.{js,ts}',
    '!**/coverage/**',
    '!**/node_modules/**'
  ]
}
