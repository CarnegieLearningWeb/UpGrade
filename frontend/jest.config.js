module.exports = {
    "preset": "jest-preset-angular",
    "rootDir": "./projects/upgrade",
    "roots": ["<rootDir>", "../../../types"],
    "coverageDirectory": "../../coverage",
    "setupFilesAfterEnv": [
        "<rootDir>/setup-jest.ts"
    ],
    "transformIgnorePatterns": [
        "node_modules/(?!@ngrx|ngx-socket-io)"
    ],
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
          "tsconfig": "<rootDir>/tsconfig.spec.json"
      }
   }
};
