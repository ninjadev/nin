(function() {
  'use strict';

  module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt);
    require('time-grunt')(grunt);

    grunt.initConfig({
      watch: {
        bower: {
          files: ['bower.json'],
          tasks: ['bowerInstall']
        },
        js: {
          files: ['app/scripts/{,*/}*.js'],
          tasks: ['newer:jshint:all'],
          options: {
            livereload: true
          }
        },
        styles: {
          files: ['app/styles/{,*/}*.css'],
          tasks: ['newer:copy:styles']
        },
        gruntfile: {
          files: ['Gruntfile.js']
        },
        livereload: {
          options: {
            livereload: '<%= connect.options.livereload %>'
          },
          files: [
            'app/{,*/}*.html',
            '.tmp/styles/{,*/}*.css',
            'app/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}'
          ]
        }
      },

      connect: {
        options: {
          port: 8000,
          hostname: '0.0.0.0',
          livereload: 8080
        },
        livereload: {
          options: {
            base: [
              '.tmp',
              'app'
            ]
          }
        },
        test: {
          options: {
            port: 9001,
            base: [
              '.tmp',
              'test',
              'app'
            ]
          }
        },
        dist: {
          options: {
            base: 'app'
          }
        }
      },

      jshint: {
        options: {
          jshintrc: '.jshintrc',
          reporter: require('jshint-stylish')
        },
        all: [
          'Gruntfile.js',
          'app/scripts/{,*/}*.js'
        ]
      },

      clean: {
        dist: {
          files: [{
            dot: true,
            src: [
              '.tmp',
              'dist/*'
            ]
          }]
        },
        server: '.tmp'
      },

      bowerInstall: {
        app: {
          src: ['app/index.html'],
          ignorePath: 'app/'
        }
      },


      // Reads HTML for usemin blocks to enable smart builds that automatically
      // concat, minify and revision files. Creates configurations in memory so
      // additional tasks can operate on them
      useminPrepare: {
        html: 'app/index.html',
        options: {
          dest: 'dist',
          flow: {
            html: {
              steps: {
                js: ['concat', 'uglifyjs'],
                css: ['cssmin']
              },
              post: {}
            }
          }
        }
      },

      usemin: {
        html: ['dist/{,*/}*.html'],
        css: ['dist/styles/{,*/}*.css'],
        options: {
          assetsDirs: ['dist']
        }
      },

      cssmin: {
        options: {
          root: 'app'
        }
      },

      imagemin: {
        dist: {
          files: [{
            expand: true,
            cwd: 'app/images',
            src: '{,*/}*.{png,jpg,jpeg,gif}',
            dest: 'dist/images'
          }]
        }
      },

      svgmin: {
        dist: {
          files: [{
            expand: true,
            cwd: 'app/images',
            src: '{,*/}*.svg',
            dest: 'dist/images'
          }]
        }
      },

      htmlmin: {
        dist: {
          options: {
            collapseWhitespace: true,
            collapseBooleanAttributes: true,
            removeCommentsFromCDATA: true,
            removeOptionalTags: true
          },
          files: [{
            expand: true,
            cwd: 'dist',
            src: ['*.html', 'views/{,*/}*.html'],
            dest: 'dist'
          }]
        }
      },

      // ngmin tries to make the code safe for minification automatically by
      // using the Angular long form for dependency injection. It doesn't work on
      // things like resolve or inject so those have to be done manually.
      ngmin: {
        dist: {
          files: [{
            expand: true,
            cwd: '.tmp/concat/scripts',
            src: '*.js',
            dest: '.tmp/concat/scripts'
          }]
        }
      },

      // Replace Google CDN references
      cdnify: {
        dist: {
          html: ['dist/*.html']
        }
      },

      // Copies remaining files to places other tasks can use
      copy: {
        dist: {
          files: [{
            expand: true,
            dot: true,
            cwd: 'app',
            dest: 'dist',
            src: [
              '*.{ico,png,txt}',
              '.htaccess',
              '*.html',
              'views/{,*/}*.html',
              'images/{,*/}*.{webp}',
              'fonts/*'
            ]
          }, {
            expand: true,
            cwd: '.tmp/images',
            dest: 'dist/images',
            src: ['generated/*']
          }]
        },
        styles: {
          expand: true,
          cwd: 'app/styles',
          dest: '.tmp/styles/',
          src: '{,*/}*.css'
        }
      },

      // Run some tasks in parallel to speed up the build process
      concurrent: {
        server: [
          'copy:styles'
        ],
        test: [
          'copy:styles'
        ],
        dist: [
          'copy:styles',
          'imagemin',
          'svgmin'
        ]
      }
    });


    grunt.registerTask('serve', function (target) {

      grunt.task.run([
        'clean:server',
        'bowerInstall',
        'concurrent:server',
        'connect:livereload',
        'watch'
      ]);
    });

    grunt.registerTask('build', [
      'clean:dist',
      'bowerInstall',
      'useminPrepare',
      'concurrent:dist',
      'concat',
      'ngmin',
      'copy:dist',
      'cdnify',
      'cssmin',
      'uglify',
      'usemin',
      'htmlmin'
    ]);

    grunt.registerTask('default', [
      'serve'
    ]);
  };
})();
