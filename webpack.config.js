const glob = require('glob');
const path = require('path');

module.exports = {
  entry: glob.sync("./src/**/*.test.ts"),
  output: {
    filename: "bundle.js",
    path: __dirname + "/out"
  },

  // Enable sourcemaps for debugging webpack's output.
  devtool: "source-map",

  resolve: {
    alias: {
      'gs-tools': path.resolve(__dirname, './node_modules/gs-tools'),
      'rxjs': path.resolve(__dirname, './node_modules/rxjs'),
      'tslib': path.resolve(__dirname, './node_modules/tslib'),
    },
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: [".ts", ".tsx", ".js", ".json"]
  },

  module: {
    rules: [
      // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
      { test: /\.tsx?$/, loader: "awesome-typescript-loader" }
    ]
  },

  mode: "development",

  // When importing a module whose path matches one of the following, just
  // assume a corresponding global variable exists and use that instead.
  // This is important because it allows us to avoid bundling all of our
  // dependencies, which allows browsers to cache those libraries between builds.
  externals: {
    "jasmine": "jasmine"
  },

  watch: true,

  plugins: [],
};
