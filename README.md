# zero-in

## Introduction

A browser extension that helps users stay focused with website restriction features and a timer that supports time-based focus and break intervals.

Please visit the [Zero In website](https://zeroin.dev) for more details and installation.

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

### How to Copy Data from One Extension to Another

If you want to copy data from one extension to another, you can use the following steps:

1. In the Target Extension Console

```javascript
chrome.runtime.onMessageExternal.addListener(function (request, sender, sendResponse) {
  if (request.action === 'import_storage' && request.data) {
    chrome.storage.local.set(request.data, function () {
      sendResponse({ success: true })
    })
    return true
  }
})
```

2. In the Source Extension Console

```javascript
chrome.storage.local.get(null, function (data) {
  chrome.runtime.sendMessage(
    TARGET_EXTENSION_ID,
    {
      action: 'import_storage',
      data: data
    },
    function (response) {
      console.log('Data transfer response:', response)
    }
  )
})
```

For the `TARGET_EXTENSION_ID`, you can find it in the URL of page in that extension, which looks like `chrome-extension://<extension-id>/`. OR you can find it in the `chrome://extensions/`.
