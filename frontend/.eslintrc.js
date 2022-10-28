/*
👋 Hi! This file was autogenerated by tslint-to-eslint-config.
https://github.com/typescript-eslint/tslint-to-eslint-config

It represents the closest reasonable ESLint configuration to this
project's original TSLint configuration.

We recommend eventually switching this configuration to extend from
the recommended rulesets in typescript-eslint. 
https://github.com/typescript-eslint/tslint-to-eslint-config/blob/master/docs/FAQs.md

Happy linting! 💖
*/
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
        'project': 'tsconfig.json',
        'tsconfigRootDir': __dirname,
        'sourceType': 'module'
    },
    'plugins': [
      // "@typescript-eslint",
      '@angular-eslint/eslint-plugin',
    ],
    'root': true,
    'rules': {
        '@angular-eslint/component-class-suffix': 'error',
        '@angular-eslint/directive-class-suffix': 'error',
        '@angular-eslint/no-input-rename': 'error',
        '@angular-eslint/no-output-on-prefix': 'error',
        '@angular-eslint/no-output-rename': 'error',
        '@angular-eslint/use-pipe-transform-interface': 'error',
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": "warn",
        "@typescript-eslint/no-explicit-any": "off" // TODO: this is a later task, way too many to tackle now
        // '@typescript-eslint/strict-boolean-expressions': 'warn'
    }
};
