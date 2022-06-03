module.exports = {
    "preset": 'jest-preset-angular',
    "rootDir": "./projects/upgrade",
    "roots": ["<rootDir>", "../../../types"],
    "coverageDirectory": "../../coverage",
    "coverageReporters": [
        "json-summary", 
        "text",
        "lcov"
    ],
    "setupFilesAfterEnv": [
        "<rootDir>/setup-jest.ts"
    ],
    // "transformIgnorePatterns": [
    //     "node_modules/(?!@ngrx|rxjs|@angular)"
    // ],
    "transform": {
        "^.+\\.(ts)$": "ts-jest"
    },
    "testPathIgnorePatterns": [
        "<rootDir>/node_modules/",
        "<rootDir>/dist/",
        "<rootDir>/e2e/",
        "<rootDir>/src/environments/"
    ],
    "globals": {
      "ts-jest": {
          "tsconfig": "<rootDir>/tsconfig.spec.json",
          useESM: true,
          stringifyContentPathRegex: '\\.html$',
       }
    },
    
};
