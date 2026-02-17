# Frontend Engineering Guidelines

This document outlines the coding standards, architectural principles, and best practices for our frontend engineering team. Adhering to these guidelines ensures code maintainability, scalability, and a unified codebase across all projects.

---

## 1. Core Principles

* **Readability over Cleverness:** Code is read far more often than it is written. Optimize for readability. Use descriptive names and avoid overly complex one-liners.
* **Reusability:** Build modular, self-contained components. If you write the same logic twice, consider extracting it into a reusable hook or utility function.
* **Predictability:** Functions should be pure wherever possible. Avoid unintended side effects.
* **Strong Typing:** Leverage TypeScript to catch errors at compile-time rather than run-time.

---

## 2. General Formatting & Tooling

We rely on automated tooling to enforce formatting. Do not argue over syntax; let the tools handle it.

* **Prettier:** Used for all code formatting. Configure your IDE to format on save.
* **ESLint:** Used for catching programmatic errors and enforcing best practices. No code should be merged with active ESLint warnings or errors.
* **Line Length:** Hard wrap at 100 characters.
* **Indentation:** Use 2 spaces for all file types (JS, TS, HTML, CSS, JSON).

---

## 3. Naming Conventions

Consistent naming is critical for navigating a large codebase.

### 3.1 Variables & Functions
* Use `camelCase` for variables, functions, and methods.
* Prefix boolean variables with `is`, `has`, `should`, or `can` (e.g., `isLoading`, `hasError`, `canSubmit`).
* Function names should be verbs or action-oriented (e.g., `fetchUserData`, `calculateTotal`, `handleClick`).

### 3.2 Constants
* Use `UPPER_SNAKE_CASE` for global constants that are genuinely immutable and exported.
* *Example:* `const MAX_RETRY_COUNT = 3;`

### 3.3 Files & Directories
* Use `kebab-case` for general file names and directories (e.g., `user-profile.ts`, `utils/`).
* Use `PascalCase` for files that export a single class or React component (e.g., `UserProfile.tsx`, `Button.tsx`).

---

## 4. JavaScript & TypeScript Standards

### 4.1 Type Safety (TypeScript)
* **Avoid `any`:** Strict use of `any` is prohibited. If the type is truly unknown, use `unknown` and perform type narrowing.
* **Interfaces vs. Types:** Use `interface` for object shapes and class contracts. Use `type` for unions, intersections, and mapped types.
* **Strict Mode:** Ensure `"strict": true` is enabled in `tsconfig.json`.

### 4.2 Variable Declarations
* Always use `const` by default.
* Use `let` only when you know the variable's value will be reassigned.
* Never use `var`.

### 4.3 Functions & Arrow Functions
* Use arrow functions (`() => {}`) for callbacks and anonymous functions.
* Avoid deeply nested callbacks; prefer `async/await`.
* Keep functions small and focused on a single responsibility.

### 4.4 Object & Array Destructuring
* Always use destructuring when accessing multiple properties from an object or array.
* *Good:* `const { id, name } = user;`
* *Bad:* `const id = user.id; const name = user.name;`

---

## 5. React Specifics

### 5.1 Component Architecture
* **Functional Components:** Use functional components and Hooks exclusively. Class components are legacy and should not be used for new features.
* **Single Responsibility:** A component should ideally do one thing. If it grows too large, break it down into smaller, composable sub-components.

### 5.2 Hooks
* Follow the [Rules of Hooks](https://reactjs.org/docs/hooks-rules.html) strictly.
* Never call Hooks inside loops, conditions, or nested functions.
* Keep dependency arrays in `useEffect`, `useMemo`, and `useCallback` accurate and complete. Use `eslint-plugin-react-hooks` to enforce this.

### 5.3 Props & State
* Keep state as local as possible. Do not elevate state to global stores unless multiple disparate components need to share it.
* Prefer derived state over syncing state. (e.g., if you have `firstName` and `lastName`, derive `fullName` on the fly rather than storing it in a separate `useState`).
* Always define explicit interfaces for Component Props.

```tsx
// Good Example
interface ButtonProps {
  label: string;
  onClick: () => void;
  isDisabled?: boolean;
}

export const Button = ({ label, onClick, isDisabled = false }: ButtonProps) => {
  return (
    <button onClick={onClick} disabled={isDisabled}>
      {label}
    </button>
  );
};