# Gemini Assistant Guide

This guide provides context for the Gemini AI assistant to ensure its contributions align with the project's standards and conventions.

## Project Overview

This project, "Zero In", is a browser extension designed to help users manage tasks and focus. It uses Firebase for backend services and is built as a modern web application inside a browser extension wrapper.

## Tech Stack

- **Monorepo Manager**: Migrating to **Nx** for workspace management.
- **Package Manager**: **Yarn** (`v4.4.1`)
- **Language**: **TypeScript**
- **Web Extension Framework**: **WXT**
- **Frontend Framework**: **Vue.js 3** with **Bootstrap-Vue-Next** for components.
- **Backend & Database**: **Firebase** (including Firestore and Firebase Authentication).
- **Unit & Integration Testing**: **Vitest**
- **E2E Testing**: **Playwright**
- **Linting**: **ESLint**
- **Formatting**: **Prettier**

## Architectural Principles

The project follows a layered architecture that separates concerns:

- **`src/domain`**: Contains the core business logic, models, and rules of the application, independent of any framework or external service.
- **`src/infra`**: Implements the interfaces to external services, such as Firebase calls, browser storage APIs, and other browser-level interactions.
- **`src/entrypoints`**: The top-level layer that connects the application to the outside world. This includes background scripts, popup UI, and options pages.
- **`src/pages`**: Contains the Vue components that make up the user interface for the various entrypoints.

## Code Style and Conventions

- **Formatting**: Code formatting is handled automatically by **Prettier**. The configuration is in `.prettierrc.json`.
- **Linting**: Code quality and style rules are enforced by **ESLint**. The configuration is in `eslint.config.js`.
- **Commits**: Prefer atomic commits where each commit represents a single, logical step. Do not use Conventional Commit prefixes (e.g., `feat:`, `fix:`).
- **File Naming**: Test files should be co-located with the source code and named with a `.spec.ts` suffix.

## Testing Strategy

- **Unit Tests (`yarn test:unit`)**: For testing individual functions and logic in the `domain`. Run with Vitest.
- **Integration Tests (`yarn test:integration`)**: For testing how different parts of the system work together, often involving Firebase emulators. Run with Vitest.
- **End-to-End (E2E) Tests (`yarn test:e2e`)**: Uses Playwright for scenarios that require direct browser interaction or access to browser-level APIs (e.g., `chrome.storage`). These tests focus on specific integration points rather than full, user-facing application flows. Uses the Firebase emulators.

## Common Commands

- `yarn dev`: Starts the development server for the extension.
- `yarn build`: Creates a production build of the extension.
- `yarn test:unit`: Runs all unit tests.
- `yarn test:integration`: Runs all integration tests.
- `yarn test:e2e`: Runs all end-to-end tests.
- `yarn lint`: Checks the codebase for linting errors.
- `yarn format`: Formats the entire codebase with Prettier.

Once migrated to Nx, these commands will be run via `nx`, e.g., `npx nx build extension`.

## Collaboration Style

- **Atomic Changes**: Please propose changes that are atomic and can be contained within a single, logical commit. For example, refactoring a function and adding a new feature should be two separate steps.
- **Read-only Steps**: For read-only actions that do not change the project's code or configuration (e.g., reading files, listing directories, searching), you do not need to ask for permission. Please state the action and proceed directly.