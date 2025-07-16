# ts-path

🚀 **Intelligent TypeScript path mapping with auto-discovery and validation**

A powerful Node.js/TypeScript package that automatically discovers, generates, and validates path mappings for TypeScript projects. Say goodbye to manual `tsconfig.json` path configuration!

## 🎯 What Problem Does This Solve?

**Before:** You manually maintain `tsconfig.json` paths every time you add/move folders:

```json
{
  "compilerOptions": {
    "paths": {
      "@components/*": ["src/components/*"],
      "@utils/*": ["src/utils/*"],
      "@services/*": ["src/services/*"],
      "@hooks/*": ["src/hooks/*"],
      "@types/*": ["src/types/*"]
    }
  }
}
```

**After:** Run one command and it's done automatically:

```bash
npx ts-path generate --merge
```

## ✨ Features

- 🔍 **Auto-discovery**: Automatically finds TypeScript files and directories in your project
- 🎯 **Smart aliasing**: Generates meaningful aliases based on file/directory names
- ✅ **Validation**: Validates existing path mappings and suggests improvements
- 🔧 **CLI Interface**: Easy-to-use command-line interface with commander
- 📝 **tsconfig.json Integration**: Seamlessly updates your TypeScript configuration
- 🧪 **Conflict Resolution**: Intelligently handles alias conflicts
- 💡 **Suggestions**: Provides intelligent suggestions for better path mappings

## 🚀 Quick Start

### Installation

```bash
npm install ts-path
# or
yarn add ts-path
```

### Basic Usage

```typescript
import { PathMapper, generatePathMappings } from "ts-path";

// Quick way to generate mappings
const mappings = await generatePathMappings({
  rootDir: "./src",
  maxDepth: 3,
});

console.log(mappings);
// Output:
// {
//   "@components": "src/components",
//   "@utils": "src/utils",
//   "@types": "src/types"
// }
```

### CLI Usage (New!)

```bash
# Discover potential mappings
npx ts-path discover

# Generate and update tsconfig.json
npx ts-path generate --merge

# Validate existing mappings
npx ts-path validate

# Get suggestions
npx ts-path suggest

# See all available commands
npx ts-path --help
```

## 📖 Real-World Examples

### Example 1: Large React Project Setup

**Scenario:** You have a React project with many folders and want clean imports.

**Project Structure:**

```
src/
├── components/
│   ├── Button/
│   ├── Modal/
│   └── Form/
├── hooks/
│   ├── useAuth.ts
│   └── useApi.ts
├── utils/
│   ├── validation.ts
│   └── helpers.ts
├── services/
│   ├── api.ts
│   └── auth.ts
└── types/
    └── index.ts
```

**Before:** Manual `tsconfig.json` setup

```json
{
  "compilerOptions": {
    "paths": {
      "@components/*": ["src/components/*"],
      "@hooks/*": ["src/hooks/*"],
      "@utils/*": ["src/utils/*"],
      "@services/*": ["src/services/*"],
      "@types/*": ["src/types/*"]
    }
  }
}
```

**After:** One command

```bash
npx ts-path generate --merge
```

**Result:** Clean imports in your code

```typescript
// Before: Messy relative imports
import Button from "../../../components/Button/Button";
import { useAuth } from "../../../hooks/useAuth";
import { validateEmail } from "../../../utils/validation";

// After: Clean absolute imports
import Button from "@components/Button/Button";
import { useAuth } from "@hooks/useAuth";
import { validateEmail } from "@utils/validation";
```

### Example 2: Monorepo Management

**Scenario:** You have a monorepo with multiple packages and want to share code between them.

**Project Structure:**

```
packages/
├── app/
│   └── src/
├── shared/
│   ├── components/
│   └── utils/
├── ui/
│   └── src/
└── types/
    └── index.ts
```

**Command:**

```bash
npx ts-path generate --root-dir packages --merge
```

**Result:** Automatic cross-package imports

```typescript
// In packages/app/src/components/Header.tsx
import { Button } from "@ui/Button";
import { formatDate } from "@shared/utils/date";
import { User } from "@types/User";
```

### Example 3: Refactoring Safety

**Scenario:** You're moving folders around and want to ensure imports don't break.

**Before Refactor:**

```
src/
├── components/
└── utils/
```

**After Refactor:**

```
src/
├── ui/
│   └── components/
└── common/
    └── utils/
```

**Command:**

```bash
npx ts-path generate --merge
```

**Result:** All imports automatically updated, no broken references!

### Example 4: Validation and Maintenance

**Scenario:** You want to ensure your path mappings are still valid after team changes.

```bash
# Check for broken mappings
npx ts-path validate

# Get suggestions for improvements
npx ts-path suggest
```

**Output:**

```
✅ All path mappings are valid!

Suggestions:
  1. Consider adding alias for common directory: @hooks -> src/hooks
  2. Consider using shorter path: src/components/Button -> components/Button
```

## 🛠️ CLI Commands

### discover

Discovers potential path mappings in the project.

```bash
npx ts-path discover [options]
```

**Options:**

- `--root-dir <path>`: Root directory to scan (default: current directory)
- `--output <path>`: Output file for results (JSON format)

**Example:**

```bash
npx ts-path discover --root-dir ./src --output ./discovered-paths.json
```

### generate

Generates path mappings and optionally updates tsconfig.json.

```bash
npx ts-path generate [options]
```

**Options:**

- `--root-dir <path>`: Root directory to scan (default: current directory)
- `--tsconfig <path>`: Path to tsconfig.json (default: tsconfig.json)
- `--output <path>`: Output file for mappings (JSON format)
- `--merge`: Merge with existing mappings (default: true)
- `--no-merge`: Replace existing mappings

**Examples:**

```bash
# Generate and merge with existing mappings
npx ts-path generate --merge

# Generate and replace all mappings
npx ts-path generate --no-merge

# Generate for specific directory and save to file
npx ts-path generate --root-dir ./packages --output ./path-mappings.json
```

### validate

Validates existing path mappings in tsconfig.json.

```bash
npx ts-path validate [options]
```

**Options:**

- `--root-dir <path>`: Root directory to scan (default: current directory)
- `--tsconfig <path>`: Path to tsconfig.json (default: tsconfig.json)

**Example:**

```bash
npx ts-path validate --tsconfig ./packages/app/tsconfig.json
```

### suggest

Gets suggestions for path mappings.

```bash
npx ts-path suggest [options]
```

**Options:**

- `--root-dir <path>`: Root directory to scan (default: current directory)

**Example:**

```bash
npx ts-path suggest --root-dir ./src
```

### update

Updates tsconfig.json with new mappings from a file.

```bash
npx ts-path update --output <path> [options]
```

**Options:**

- `--output <path>`: Input file with mappings (JSON format) (required)
- `--tsconfig <path>`: Path to tsconfig.json (default: tsconfig.json)
- `--merge`: Merge with existing mappings (default: true)
- `--no-merge`: Replace existing mappings
- `--root-dir <path>`: Root directory to scan (default: current directory)

**Example:**

```bash
npx ts-path update --output ./custom-mappings.json --merge
```

## 📖 API Reference

### PathMapper Class

The main class for path mapping operations.

```typescript
import { PathMapper } from "ts-path";

const mapper = new PathMapper({
  rootDir: "./src",
  maxDepth: 3,
  includePatterns: ["**/*.ts", "**/*.tsx"],
  excludePatterns: ["**/*.d.ts", "**/node_modules/**"],
});
```

#### Options

| Option             | Type       | Default                                             | Description                     |
| ------------------ | ---------- | --------------------------------------------------- | ------------------------------- |
| `rootDir`          | `string`   | `process.cwd()`                                     | Root directory to scan          |
| `maxDepth`         | `number`   | `3`                                                 | Maximum directory depth to scan |
| `includePatterns`  | `string[]` | `['**/*.ts', '**/*.tsx']`                           | File patterns to include        |
| `excludePatterns`  | `string[]` | `['**/*.d.ts', '**/node_modules/**', '**/dist/**']` | Patterns to exclude             |
| `autoGenerate`     | `boolean`  | `true`                                              | Auto-generate mappings          |
| `validateExisting` | `boolean`  | `true`                                              | Validate existing mappings      |

#### Methods

##### `discoverPaths()`

Discovers potential path mappings in the project.

```typescript
const discovered = await mapper.discoverPaths();
// Returns: DiscoveredPath[]
```

##### `generateMappings()`

Generates path mappings from discovered paths.

```typescript
const result = await mapper.generateMappings();
// Returns: PathMapperResult
```

##### `validateExistingMappings(tsConfigPath?)`

Validates existing path mappings in tsconfig.json.

```typescript
const validation = await mapper.validateExistingMappings("./tsconfig.json");
// Returns: ValidationResult
```

##### `updateTsConfig(mappings, tsConfigPath?, merge?)`

Updates tsconfig.json with new path mappings.

```typescript
await mapper.updateTsConfig({
  "@components": "src/components",
  "@utils": "src/utils",
});
```

### Convenience Functions

#### `generatePathMappings(options?)`

Quick function to generate path mappings.

```typescript
import { generatePathMappings } from "ts-path";

const mappings = await generatePathMappings({
  rootDir: "./src",
});
```

#### `validatePathMappings(tsConfigPath?, options?)`

Quick function to validate existing mappings.

```typescript
import { validatePathMappings } from "ts-path";

const isValid = await validatePathMappings("./tsconfig.json");
```

#### `updateTsConfigMappings(mappings, tsConfigPath?, merge?, options?)`

Quick function to update tsconfig.json.

```typescript
import { updateTsConfigMappings } from "ts-path";

await updateTsConfigMappings({
  "@components": "src/components",
});
```

## 🔧 Development Workflow

### For New Projects

1. **Initialize your TypeScript project**
2. **Run the mapper:**
   ```bash
   npx ts-path generate --merge
   ```
3. **Start coding with clean imports!**

### For Existing Projects

1. **Validate current mappings:**
   ```bash
   npx ts-path validate
   ```
2. **Get suggestions:**
   ```bash
   npx ts-path suggest
   ```
3. **Update mappings:**
   ```bash
   npx ts-path generate --merge
   ```

### For CI/CD Integration

```yaml
# .github/workflows/validate-paths.yml
name: Validate Path Mappings
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm install
      - run: npx ts-path validate
```

## 📁 Project Structure

```
ts-path/
├── src/
│   ├── types/
│   │   └── index.ts          # TypeScript type definitions
│   ├── utils/
│   │   └── fileUtils.ts      # File system utilities
│   ├── PathMapper.ts         # Main PathMapper class
│   ├── index.ts              # Main exports
│   ├── cli.ts                # CLI interface (commander-based)
│   └── __tests__/
│       └── PathMapper.test.ts # Tests
├── package.json
├── tsconfig.json
├── jest.config.js
├── .eslintrc.js
└── README.md
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

## 🔧 Development

```bash
# Install dependencies
yarn install

# Build the project
yarn build

# Run in development mode
yarn dev

# Lint the code
yarn lint

# Fix linting issues
yarn lint:fix
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the need for better TypeScript path management
- Built with modern TypeScript practices
- Tested with Jest for reliability
- CLI powered by Commander.js

## 📞 Support

If you have any questions or need help, please open an issue on GitHub or contact the maintainers.

---

**Made with ❤️ for the TypeScript community**

## 🚀 Releasing (for Maintainers)

This project uses [release-it](https://github.com/release-it/release-it) for automated versioning, changelogs, GitHub releases, and npm publishing.

### To create a new release:

1. Make sure your working directory is clean and on the `main` branch.
2. Run:
   ```bash
   yarn release
   ```

   - This will:
     - Prompt for the next version
     - Run tests and build
     - Update the version in `package.json`
     - Generate/update `CHANGELOG.md`
     - Commit, tag, push, create a GitHub release, and publish to npm

### To generate or update the changelog only:

```bash
yarn changelog
```

> **Note:** You must have `NPM_TOKEN` and `GITHUB_TOKEN` set in your environment or repository secrets for CI/CD.
