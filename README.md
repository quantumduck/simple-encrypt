# node-gts-jest-boilerplate

This repository serves as a starting point for NodeJS TypeScript projects. It includes jest for writing and running tests. It also includes Google's TypeScript style guide.

The project focuses around using Visual Studio Code as your IDE. It includes .vscode directory that allows you to debug the application as well as the jest tests (you will need the vscode-jest extension for this to work).

Two tsconfig files are included. The `tsconfig.json` file is to be used during development and will be used by running `npm run compile` as well as when the debugger runs. There is an additional `tsconfig.prod.json` that will compile but will omit files such as source maps.

## Adding Code

The repository expects all code to be added into the `src` directory. It's recommended that you organize your code into subfolders with the exception of the `index.ts`.

## Running Tests

To run tests, you can run `npm run test`. This will look through any subfolders within the `src` directory for any test files that follow the `*.test.ts` or `*.spec.ts` naming scheme.
