// eslint-disable-next-line import/no-extraneous-dependencies
const { createConfig } = require('@openedx/frontend-build');

// Host internals are imported through the `CourseAuthoring` alias, which only
// resolves when this package is built by the host app. Ignore it here so the
// package can be linted standalone.
module.exports = createConfig('eslint', {
  rules: {
    'import/no-unresolved': ['error', { ignore: ['^CourseAuthoring/'] }],
    'import/no-extraneous-dependencies': ['error', {
      devDependencies: true,
      optionalDependencies: false,
      peerDependencies: true,
    }],
  },
});
