const { createConfig } = require('@openedx/frontend-build');

module.exports = createConfig('jest', {
  setupFilesAfterEnv: [
    '<rootDir>/src/setupTest.js',
  ],
  coveragePathIgnorePatterns: [
    'src/setupTest.js',
    'src/i18n',
  ],
  // Host internals are resolved by the host at build time; map the alias so
  // any standalone tests can mock them.
  moduleNameMapper: {
    '^CourseAuthoring/(.*)$': '<rootDir>/src/__mocks__/courseAuthoring/$1',
  },
});
