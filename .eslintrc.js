module.exports = {
    'env': {
        'browser': true,
        'es6': true,
        'node': true,
        'jest': true
    },
    'extends': [
      "eslint:recommended",
      "plugin:@typescript-eslint/recommended",
      // "plugin:@typescript-eslint/recommended-requiring-type-checking",
      // "plugin:@typescript-eslint/strict",
      'prettier'
    ],
    'parser': '@typescript-eslint/parser',
    'parserOptions': {
        'project': 'tsconfig.root.json',
        'tsconfigRootDir': __dirname,
        'sourceType': 'module'
    },
    'plugins': [
      "@typescript-eslint",
      '@angular-eslint/eslint-plugin',
      'eslint-plugin-tsdoc',
      'prettier'
    ],
    'root': true,
    'rules': {
        'tsdoc/syntax': 'warn',
        '@angular-eslint/component-class-suffix': 'error',
        '@angular-eslint/directive-class-suffix': 'error',
        '@angular-eslint/no-input-rename': 'error',
        '@angular-eslint/no-output-on-prefix': 'error',
        '@angular-eslint/no-output-rename': 'error',
        '@angular-eslint/use-pipe-transform-interface': 'error',
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": "warn",
        "@typescript-eslint/no-explicit-any": "off", // TODO: this is a later task, way too many to tackle now
        "prettier/prettier": 2,
        '@typescript-eslint/strict-boolean-expressions': 'off'
    }
};
