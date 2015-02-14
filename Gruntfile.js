'use strict';

module.exports = function (grunt) {
    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        jshint: {
            options: {
                "jshintrc": ".jshintrc"
            },
            app: ['src/**/*.js']
        },

        jasmine: {
            src: 'src/js/jqPaginator.js',
            options: {
                specs: 'test/specs/**/*Spec.js'
            }
        },

        copy: {
            main: {
                files: [
                    {
                        src: ['src/**', 'config.js', 'package.json', 'startup', '!src/_*'],
                        dest: 'dist/'
                    }
                ]
            }
        },

        uglify: {
            options: {
                banner: '/*! http://findit.so */\n',
                beautify: {
                    ascii_only: true
                },
                compress: {
                    global_defs: {
                        'DEBUG': false
                    },
                    dead_code: true
                }
            },
            antcolony: {
                files: [
                    {
                        expand: true,
                        cwd: 'dist/src',
                        src: ['**/*.js', '!config.js'],
                        dest: 'dist/src',
                        ext: '.js'
                    }
                ]
            }
        },

        sftp: {
            main: {
                files: {
                    './': ['dist/**/*']
                },
                // digitalocean
                options: {
                    path: '<path>',
                    host: '<host>',
                    username: '<username>',
                    password: '<password>',
                    showProgress: true,
                    createDirectories: true,
                    srcBasePath: 'dist/'
                }
            }
        },

        sshexec: {
            // digitalocean
            options: {
                host: '<host>',
                username: '<username>',
                password: '<password>'
            },
            setup: {
                command: 'cd /antcolony && mkdir log && mkdir .temp && npm install --production'
            },
            clean: {
                command: 'rm -rf /antcolony/src /antcolony/config.js /antcolony/package.json /antcolony/startup'
            }
        }

    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-ssh');

    grunt.registerTask('test', ['jshint'/*,'jasmine'*/]);

    grunt.registerTask('deploy', ['sftp']);

    grunt.registerTask('server-setup', ['sshexec:setup']);

    grunt.registerTask('server-clean', ['sshexec:clean']);

    grunt.registerTask('default', ['test', 'copy', 'uglify'/*, 'deploy'*/]);
};