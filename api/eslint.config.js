const js = require('@eslint/js');

module.exports = [
  js.configs.recommended,
  {
    files: ["src/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "readonly",
        console: "readonly"
      }
    },
    rules: {
      // Prevent console statements in production code
      "no-console": ["error", {
        "allow": ["warn", "error"] // Allow console.warn and console.error
      }],
      
      // Prevent debugger statements
      "no-debugger": "error",
      
      // Prevent unused variables
      "no-unused-vars": ["error", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }],
      
      // Code quality rules
      "no-var": "error",
      "prefer-const": "error",
      "no-duplicate-imports": "error",
      "no-unreachable": "error",
      "no-undef": "error",
      
      // Security-related rules
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      
      // Best practices
      "eqeqeq": ["error", "always"],
      "curly": ["error", "all"],
      "no-shadow": "error",
      "no-redeclare": "error"
    }
  },
  {
    // Allow console statements in test files
    files: ["**/*.test.js", "**/*.spec.js", "jest.setup.js"],
    rules: {
      "no-console": "off"
    }
  }
];