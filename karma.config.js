module.exports = function(config) {
  config.set({
    frameworks: ["jasmine"],
    files: [
      {pattern: "out/bundle-test.js", watched: true, included: true},
      {pattern: "out/bundle-test.js.map", watched: true, included: false},
    ],
    exclude: [
    ],
    preprocessors: {
    },
    plugins: [
      require("karma-jasmine"),
      require("karma-sourcemap-loader"),
      require("karma-chrome-launcher"),
      require("dev/karma-reporter"),
    ],
    port: 8888,
    browsers: ['ChromeHeadless'],
    reporters: ["gs"],
    singleRun: false
  });
};
