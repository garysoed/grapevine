declare({
  name: 'link',
  as: shell({
    bin: 'npm',
    flags: [
      'link',
      'gs-tools',
      'gs-testing',
      'gs-types',
      'dev',
      'moirai',
      'santa',
      'devbase',
    ],
  }),
});