const glob = require('glob');
const webpackBuilder = require('dev/webpack/builder');

module.exports = webpackBuilder(__dirname)
    .forDevelopment('[default]', builder => builder
        .addEntry('test', glob.sync('./src/**/*.test.ts'))
        .setOutput('bundle-[name].js', '/out')
        .addTypeScript()
        .addHtml()
    )
    .build();
