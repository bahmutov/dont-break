module.exports = function(grunt) {
  'use strict';

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      all: [
        'index.js', 'src/**/*.js'
      ],
      specs: ['test/*.js'],
      options: {
        jshintrc: '.jshintrc',
        reporter: require('jshint-summary')
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

  grunt.registerTask('default',
    ['nice-package', 'deps-ok', 'jshint']);
};
