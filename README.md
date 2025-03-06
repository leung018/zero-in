# task-concentrator

## Introduction

A Chrome extension that helps users stay focused by implementing website restriction features and a timer supporting the Pomodoro Technique.

I am planning to release this extension on the Chrome Web Store later. If you have interest in the current development version, you can download the extension from the [Releases](https://github.com/leung018/task-concentrator/releases). Download the `task-concentrator-dev-latest.zip` file, unzip it, and load the extension in Chrome by enabling the Developer mode in the Extensions page.

## Development

### Prerequisites

- Node.js: I use v20 and if you use nvm, you can run `nvm use` to switch to that version.
- Yarn: Follow the instructions [here](https://yarnpkg.com/getting-started/install) for how to enabling Yarn if you haven't.

### Install the Dependencies

```sh
yarn
```

### Compile and Hot-Reload for Development

```sh
yarn dev
```

### Type-Check, Compile and Minify for Production

```sh
yarn build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
yarn test:unit
```

### Run End-to-End Tests with [Playwright](https://playwright.dev)

```sh
# Install browsers for the first run
npx playwright install

# When testing on CI, must build the project first
yarn build

# Runs the end-to-end tests
yarn test:e2e
```

### Lint with [ESLint](https://eslint.org/)

```sh
yarn lint
```
