const webpackBuilder = require('dev/webpack/builder');
const glob = require('glob');

module.exports = webpackBuilder(__dirname)
    .forDevelopment('main', builder => builder
        .addEntry('test', glob.sync('./src/**/*.test.ts'))
        .setOutput('bundle-[name].js', '/out')
        .addTypeScript()
        .addHtml(),
    )
    .build('main');
