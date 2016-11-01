module.exports = function(grunt) {
  'use strict';

  var sourceFiles = ['index.js', 'src/**/*.js'];

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    filenames: {
      options: {
        valid: 'dashes'
      },
      src: sourceFiles
    }
  });

  var plugins = require('matchdep').filterDev('grunt-*');
  plugins.forEach(grunt.loadNpmTasks);

  grunt.registerTask('lint', ['filenames']);
  grunt.registerTask('default',
    ['nice-package', 'deps-ok', 'lint']);
};
