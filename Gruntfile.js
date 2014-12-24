module.exports = function(grunt) {
  'use strict';

  var sourceFiles = ['index.js', 'src/**/*.js'];

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      all: sourceFiles,
      specs: ['test/*.js'],
      options: {
        jshintrc: '.jshintrc',
        reporter: require('jshint-summary')
      }
    },

    eslint: {
      target: sourceFiles,
      options: {
        config: 'eslint.json',
        rulesdir: ['./node_modules/eslint-rules']
      }
    },

    jscs: {
      src: sourceFiles,
      options: {
          config: 'jscs.json'
      }
    },

    watch: {
      options: {
        atBegin: true
      },
      all: {
        files: ['*.js', 'src/**/*.js', 'test/*.js', 'package.json'],
        tasks: ['jshint']
      }
    }
  });

  var plugins = require('matchdep').filterDev('grunt-*');
  plugins.forEach(grunt.loadNpmTasks);

  grunt.registerTask('lint', ['jshint', 'eslint', 'jscs']);
  grunt.registerTask('default',
    ['nice-package', 'deps-ok', 'lint']);
};
