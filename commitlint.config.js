module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'refactor', // Code refactoring
        'docs',     // Documentation changes
        'style',    // Code style changes (formatting)
        'test',     // Adding or updating tests
        'chore',    // Maintenance tasks
        'perf',     // Performance improvements
        'ci',       // CI/CD changes
        'build',    // Build system changes
        'revert',   // Revert previous commit
      ],
    ],
    'scope-enum': [
      2,
      'always',
      [
        'projects',
        'tickets',
        'board',
        'auth',
        'api',
        'ui',
        'db',
        'permissions',
        'comments',
        'attachments',
        'checklists',
        'labels',
        'invites',
        'reactions',
        'ci',
        'deps',
        'config',
        'tests',
      ],
    ],
    'subject-case': [2, 'always', 'sentence-case'],
    'subject-max-length': [2, 'always', 100],
  },
};
