load('node_modules/devbase/.mk.config-base.js');
load('node_modules/devbase/ts/.mk.config-base.js');

set_vars({
  vars: {
    local_deps: [
      'devbase',
      'gs-tools',
      'gs-testing',
      'gs-types',
      'moirai',
      'santa',
    ],
  },
});
