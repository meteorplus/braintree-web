'use strict';

var gulp = require('gulp');
var Karma = require('karma').Server;
var run = require('run-sequence');
var path = require('path');
var fs = require('fs');
var spawn = require('child_process').spawn;

var TEST_DIR = path.resolve(__dirname, '..', 'test') + '/';
var COMPONENTS = require('../components.json')
var KARMA_SUITES = COMPONENTS.concat('lib');
var TEST_TASKS = [
  'lint',
  'test:environment',
  'mocha:publishing',
  'test:node-parsing'
];

function _lint(src, test, done) {
  spawn('eslint', [
    'src/' + src,
    'test/' + test
  ], {
    stdio: 'inherit'
  }).on('exit', function (code, signal) {
    if (code === 0) {
      done();
    } else {
      done('eslint reported errors');
    }
  });
}

function _karma(suite, done) {
  new Karma({
    configFile: TEST_DIR + suite + '/config/karma.js',
    singleRun: true
  }, done).start();
}

function _mocha(suite, done) {
  var projectRoot = path.resolve(__dirname, '..');
  var mochaPath = path.resolve(projectRoot, 'node_modules', '.bin', 'mocha');
  var testPath = path.resolve(projectRoot, 'test', suite);

  spawn(mochaPath, [testPath], {
    stdio: 'inherit'
  }).on('exit', (code) => {
    if (code === 0) {
      done();
    } else {
      done('mocha exited with code ' + code);
    }
  });
}

KARMA_SUITES.forEach(function (suite) {
  var karmaTask = 'karma:' + suite;
  var lintTask = 'lint:' + suite;
  var standaloneTestTask = 'test:' + suite;

  TEST_TASKS.push(karmaTask);

  gulp.task(karmaTask, function (done) {
    _karma(suite, done);
  });
  gulp.task(lintTask, function (done) {
    _lint(suite, suite, done);
  });
  gulp.task(standaloneTestTask, function (done) {
    run(lintTask, karmaTask, done);
  });
});

gulp.task('mocha:publishing', function (done) {
  _mocha('publishing', done);
});
gulp.task('lint:publishing', function (done) {
  _lint('index.js', 'publishing', done);
});
gulp.task('test:publishing', function (done) {
  run('build', 'lint:publishing', 'mocha:publishing', done);
});

gulp.task('test:node-parsing', function (done) {
  var error, bt;

  try {
    bt = require('../dist/npm');
  } catch (e) {
    error = e;
  }

  done(error);
});

gulp.task('test:environment', function (done) {
  _mocha('environment', done);
});

gulp.task('lint', function(done) {
  _lint('', '', done);
});

gulp.task('test', ['build'], function (done) {
  TEST_TASKS.push(done);
  run.apply(null, TEST_TASKS);
});
