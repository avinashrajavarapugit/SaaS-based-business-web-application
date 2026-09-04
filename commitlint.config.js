export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Matches the scopes already used across the history.
    'scope-enum': [
      2,
      'always',
      ['api', 'web', 'shared', 'db', 'auth', 'ci', 'deps', 'docs', 'infra'],
    ],
    'body-max-line-length': [0],
  },
};
