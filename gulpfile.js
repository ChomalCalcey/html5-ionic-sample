var gulp = require('gulp');
var gutil = require('gulp-util');
var sass = require('gulp-sass');
var zip = require('gulp-zip');
var open = require('open');
var jsonminify = require('gulp-jsonminify');
var data = require('gulp-data');
var fs = require('fs');
var jscs = require('gulp-jscs');
var del = require('del');

// Load plugins
var $ = require('gulp-load-plugins')();

gulp.task('sass', function(done) {
  gulp.src('./scss/**/*.scss')
    .pipe(sass())
    .pipe(gulp.dest('./www/css/'))
    .on('end', done);
});

gulp.task('watch', function() {
  gulp.watch('./scss/**/*.scss', ['sass']);
});

gulp.task('install', ['git-check'], function() {
  return bower.commands.install()
    .on('log', function(data) {
      gutil.log('bower', gutil.colors.cyan(data.id), data.message);
    });
});

gulp.task('git-check', function(done) {
  if (!sh.which('git')) {
    console.log(
      '  ' + gutil.colors.red('Git is not installed.'),
      '\n  Git, the version control system, is required to download Ionic.',
      '\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
      '\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
    );
    process.exit(1);
  }
  done();
});

// Scripts
gulp.task('scripts', function() {
  return gulp.src(['www/js/**/*.js'])
    .pipe(jscs())
    .pipe($.jshint('.jshintrc'))
    .pipe($.jshint.reporter('default'))
    .pipe($.size());
});

gulp.task('templates', function() {
  return gulp.src('www/templates/**/*.html')
    .pipe($.minifyHtml({
      empty: true,
      spare: true,
      quotes: true
    }))
    .pipe($.ngHtml2js({
      moduleName: 'starter',
      prefix: 'templates/'
    }))
    .pipe(gulp.dest('.tmp/templates'))
    .pipe($.size());
});

// HTML
gulp.task('html', ['clean', 'sass', 'scripts', 'templates'], function() {
  var jsFilter = $.filter('**/*.js');
  var cssFilter = $.filter('**/*.css');

  return gulp.src('www/*.html')
    .pipe($.inject(gulp.src('.tmp/templates/**/*.js'), {
      read: false,
      starttag: '<!-- inject:templates -->',
      addRootSlash: false,
      addPrefix: '../'
    }))
    .pipe($.useref.assets())
    .pipe(jsFilter)
    .pipe($.uglify())
    .pipe(jsFilter.restore())
    .pipe(cssFilter)
    .pipe($.csso())
    .pipe(cssFilter.restore())
    .pipe($.useref.restore())
    .pipe($.useref())
    .pipe(gulp.dest('dist'))
    .pipe($.size());
});

// Images
gulp.task('images', ['clean'], function() {
  return gulp.src('www/img/**/*')
    .pipe($.imagemin({
      optimizationLevel: 3,
      progressive: true,
      interlaced: true
    }))
    .pipe(gulp.dest('dist/img', {force: true}))
    .pipe($.size());
});

gulp.task('fonts', function() {
  gulp.src(['www/lib/ionic/fonts/*.{eot,svg,ttf,woff}'])
    .pipe(gulp.dest('dist/lib/ionic/fonts'))
    .pipe($.size());
});

// Clean
gulp.task('clean', function(cb) {
  del(['dist/*.*'], cb);
});

// Build
gulp.task('build', ['clean', 'html', 'images', 'data_minify', 'fonts']);

// Default task
gulp.task('default', function() {
  gulp.start('build');
});

// Zip Build File
gulp.task('zip', ['build'], function() {
  var allSrc = ['**/*'];
  return gulp.src(allSrc, {cwd: __dirname + "/dist"})
    .pipe(zip('archive.zip'))
    .pipe(gulp.dest('compiled'));
});

// Minify Data JSON
gulp.task('data_minify', ['clean'], function() {
  gulp.src(['www/data/*.json'])
    .pipe(jsonminify())
    .pipe(gulp.dest('dist/data'));
});

gulp.task('test', function(done) {
  karma.start({
    configFile: __dirname + '/karma-conf.js',
    singleRun: true
  }, done);
});