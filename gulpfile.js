var gulp = require('gulp');
var gutil = require('gulp-util');
var bower = require('bower');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var sh = require('shelljs');
var $ = require('gulp-load-plugins')();
var wiredep = require('wiredep').stream;
var path = require('path');
var eslint = require('gulp-eslint');
var del = require('del');
var zip = require('gulp-zip');
var replace = require('gulp-replace');

var conf = {
  wiredep: {
    exclude: [/jquery/, /\/bootstrap\.js$/, /\/bootstrap-sass\/.*\.js/],
    directory: 'www/lib'
  },
  paths: {
    sass: ['./scss/**/*.scss'],
    bower: 'www/lib',
    src: 'www',
    dist: 'dist'
  }
};

gulp.task('default', ['sass', 'lint']);

gulp.task('sass', function(done) {
  gulp.src('./scss/styles.scss')
    .pipe(sass())
    .on('error', sass.logError)
    .pipe(gulp.dest('./www/css/'))
    // .pipe(minifyCss({
    //   keepSpecialComments: 0
    // }))
    // .pipe(rename({
    //   extname: '.min.css'
    // }))
    .pipe(gulp.dest('./www/css/'))
    .on('end', done);
});

gulp.task('watch', function() {
  gulp.watch(conf.paths.sass, ['sass']);
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
      '\n  Download git here:', gutil.colors.cyan(
        'http://git-scm.com/downloads') + '.',
      '\n  Once git is installed, run \'' + gutil.colors.cyan(
        'gulp install') + '\' again.'
    );
    process.exit(1);
  }
  done();
});

gulp.task('partials', function() {
  return gulp.src('www/**/*.html')
    .pipe(replace('img src="../../img', 'img src="./img'))
    .pipe($.htmlmin({
      removeEmptyAttributes: true,
      removeAttributeQuotes: true,
      collapseBooleanAttributes: true,
      collapseWhitespace: true
    }))
    .pipe($.angularTemplatecache('templateCacheHtml.js', {
      module: 'starter'
    }))
    .pipe(gulp.dest('www/partials'));
});

gulp.task('inject', function() {
  var injectStyles = gulp.src(['www/**/*.css', path.join('!' + conf.paths.bower,
    '**/*.*')], {
      read: false
    });
  var injectScripts = gulp.src(['www/**/*.js', path.join('!' + conf.paths.bower,
    '**/*.*'), path.join('!' + conf.paths.src, 'partials/*.*')]);

  var injectOptions = {
    ignorePath: [],
    addRootSlash: false,
    relative: true
  };

  return gulp.src('www/index.tpl.html')
    .pipe($.inject(injectStyles, injectOptions))
    .pipe($.inject(injectScripts.pipe($.angularFilesort()), injectOptions))
    .pipe(wiredep(conf.wiredep))
    .pipe($.rename('index.html'))
    .pipe(gulp.dest('./www', {
      overwrite: true
    }));
});

gulp.task('inject-partials', ['partials', 'inject'], function() {
  var injectPartials = gulp.src('www/partials/templateCacheHtml.js', {
    read: false
  });

  var partialsInjectOptions = {
    starttag: '<!-- inject:partials -->',
    addRootSlash: false,
    relative: true
  };

  return gulp.src('www/index.html')
    .pipe($.inject(injectPartials, partialsInjectOptions))
    .pipe(gulp.dest('./www', {
      overwrite: true
    }));
});

gulp.task('lint', function() {
  return gulp.src(['www/**/*.js', '!www/lib/**'])
    .pipe(eslint())
    .pipe(eslint.format());
});

gulp.task('fonts', function() {
  return gulp.src([path.join(conf.paths.bower, 'ionic', 'fonts/*.*'), path.join(conf.paths.src, 'fonts/*.*')])
    .pipe(gulp.dest(path.join(conf.paths.dist, 'fonts')));
});

gulp.task('images', function() {
  return gulp.src([path.join(conf.paths.src, 'img/*.*')])
    .pipe(gulp.dest(path.join(conf.paths.dist, 'img')));
});

gulp.task('build', ['clean', 'sass', 'inject-partials', 'fonts', 'images'], function() {

  var htmlFilter = $.filter('www/index.html', {
    restore: true
  });
  var jsFilter = $.filter('**/*.js', {
    restore: true
  });
  var cssFilter = $.filter('**/*.css', {
    restore: true
  });

  return gulp.src(path.join(conf.paths.src, '/index.html'))
    .pipe($.useref())
    .pipe(jsFilter)
    .pipe($.ngAnnotate())
    .pipe($.uglify({
      preserveComments: $.uglifySaveLicense
    }))
    .pipe(jsFilter.restore)
    .pipe(cssFilter)
    .pipe(replace('url("../../img', 'url("../img'))
    .pipe($.cssnano())
    .pipe(cssFilter.restore)
    .pipe(htmlFilter)
    .pipe($.htmlmin({
      removeEmptyAttributes: true,
      removeAttributeQuotes: true,
      collapseBooleanAttributes: true,
      collapseWhitespace: true,
      removeComments: true
    }))
    .pipe(htmlFilter.restore)
    .pipe($.revReplace())
    .pipe(gulp.dest(path.join(conf.paths.dist, '/')))
    .pipe($.size({
      title: path.join(conf.paths.dist, '/'),
      showFiles: true
    }));
});

gulp.task('zip', ['build'], function() {
  var allSrc = ['dist/**/*'];

  return gulp.src(allSrc)
    .pipe(zip('archive.zip'))
    .pipe(gulp.dest('compiled'));
});

gulp.task('clean', function() {
  del.sync([conf.paths.dist]);
});
