# Testing and Debugging MERN Application

This repository contains the Week 6 reliability assignment for the PLP MERN Stack programme. The Express back end exposes authentication, catalogue, swap, category, and dashboard APIs while the accompanying test suites demonstrate how to protect a MERN codebase with layered automated testing and pragmatic debugging aids.

## Prerequisites

- Node.js 18+
- npm 9+ (or yarn/pnpm equivalent)
- MongoDB 6+ (local instance or Atlas URI)
- Optional: Cloudinary account for asset uploads

## Install & Run

1. **Clone the repository**
   ```powershell
   git clone <your-assignment-repo-url>
   cd testing-and-debugging-ensuring-mern-app-reliability-Ellyj12
   ```
2. **Install root tooling (Jest, SuperTest, Cypress cli)**
   ```powershell
   npm install
   ```
3. **Install server dependencies**
   ```powershell
   cd server
   npm install
   ```
4. **Create `server/.env`** with the values your environment needs:
   ```dotenv
   NODE_ENV=development
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/swapper
   JWT_SECRET=super-secret-value
   CLIENT_URL=http://localhost:5173
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```
    <!-- The bundled `cloudinaryConfig.js` currently hard-codes credentials; switch it to `process.env` for production use. -->
5. **Start the API**
   ```powershell
   npm run dev   # Nodemon-driven development server
   # or
   npm start     # Plain Node for production/staging
   ```
6. *(Optional)* **Seed local data**
   ```powershell
   node seed.js
   ```
   This populates sample users, items, and swaps that exercise every critical route.

The default service exposes a `/health` probe for quick uptime checks and logs structured JSON to `server/logs/errors.log`.

## Running Tests

All executable examples below assume you are inside the `server` directory unless noted otherwise.

- **Server unit tests (controllers, validators, utilities)**
  ```powershell
  npx cross-env NODE_ENV=test jest tests/unit --runInBand --detectOpenHandles
  ```
- **Server integration tests (HTTP flows with SuperTest + MongoMemoryServer)**
  ```powershell
  npx cross-env NODE_ENV=test jest tests/integration --runInBand --detectOpenHandles
  ```
- **Full server coverage report (targets 70% lines/functions/statements)**
  ```powershell
  npx cross-env NODE_ENV=test jest --coverage --runInBand
  ```
  Coverage assets are written to `server/coverage/`. Open `server/coverage/lcov-report/index.html` in a browser for an interactive drill-down.
- **Client React unit tests** (runs the sample Button test; add your components under `client/src/components`)
  ```powershell
  cd ..             # back to repository root
  npm install --save-dev @testing-library/react @testing-library/jest-dom react react-dom babel-jest @babel/preset-react
  npx jest --selectProjects client --runInBand
  ```
- **End-to-end smoke tests with Cypress** (stub project provided)
  ```powershell
  npx cypress open
  ```
  Add scenarios to `client/cypress/e2e/` (create the folder if it does not yet exist) to cover your highest value user journeys.

> **First-run note:** `mongodb-memory-server` downloads a MongoDB binary the first time the integration suite executes. Allow a minute for this step.

## Testing Approach & Coverage

- **Unit tests** ensure business logic remains deterministic. Server-side suites cover controllers (auth, category, item, swap), model statics, and validation helpers. The front-end example uses React Testing Library to verify render output, variant styling, and interaction semantics for the `Button` component.
- **Integration tests** issue real HTTP requests against the Express app via SuperTest. A fresh in-memory MongoDB instance (`MongoMemoryServer`) replaces external infrastructure, yielding reproducible scenarios that assert request/response contracts and authentication flows.
- **Mocking & isolation** are central: Cloudinary uploads, Winston logging, and Multer storage are mocked in `server/tests/jest.setupMocks.js` so that tests stay fast and deterministic while still exercising error paths through the middleware stack.
- **Coverage thresholds** are enforced globally at 70% statements/functions/lines and 60% branches (see `jest.config.js`). Running Jest with `--coverage` generates LCOV, HTML, Clover, and textual reports so you can document evidence within your submission.
- **Cypress scaffolding** supports black-box verification once your React UI is wired up. Use it to assert end-to-end flows such as registration, listing items, and completing a swap.

## Debugging Techniques Employed

- **Structured logging with Winston** (`server/utils/logger.js`) captures error metadata (request path, method, stack trace) and stores it both in the console and `server/logs/errors.log`, making post-mortems straightforward.
- **Centralised error middleware** (`middlewear/errorHandler.js`) normalises validation errors, Multer upload failures, and unexpected exceptions into consistent JSON responses while shielding sensitive stacks in production.
- **Request insights** via `morgan` (enabled outside the test environment) give real-time visibility into HTTP throughput and response codes.
- **Health checks & graceful startup**: `/health` exposes service status, and the server only boots after a successful DB connection, preventing hard-to-trace race conditions.
- **Hot reload & watch mode**: `npm run dev` leverages Nodemon so logic changes are reloaded automatically while debugging locally.
- **Deterministic database state**: `MongoMemoryServer` wipes collections before each integration test, ensuring bugs are reproducible and not data-dependent.
- **Targeted scripts**: `server/scripts/syncIndexes.js` and `server/seed.js` provide repeatable ways to validate schema/index issues and recreate fixture data during troubleshooting sessions.



Happy testing! Bring any failing test, log excerpt, or debugging trace into your reflection to earn full credit.