/*jshint esversion: 6 */

/* HT: https://aaronlasseigne.com/2016/02/03/using-gulp-with-jekyll/ */
/* HT: https://medium.com/superhighfives/deploying-to-github-pages-with-gulp-c06efc527de8 */

const child         = require('child_process');
const browserSync   = require('browser-sync').create();

const gulp          = require('gulp');
const deploy        = require('gulp-gh-pages');
const concat        = require('gulp-concat');
const sass          = require('gulp-sass');
const gutil         = require('gulp-util');
const autoprefixer  = require('gulp-autoprefixer');
const cleanCSS      = require('gulp-clean-css');
const notify        = require("gulp-notify");
const plumber       = require("gulp-plumber");

const siteRoot  = '_site';
const cssFiles  = '_sass/**/*.?(s)css';

/**
 * Process SASS and concatenate all CSS files into a single file.
 */
gulp.task('css', () => {
  return gulp.src(cssFiles)
    .pipe(plumber({errorHandler: notify.onError("CSS Error: <%= error.message %>")}))
    .pipe(sass())
    .pipe(autoprefixer({
        browsers: ['last 2 versions'],
        cascade: false
    }))
    .pipe(cleanCSS({}))
    .pipe(concat('main.css'))
    .pipe(gulp.dest('assets/css/'))
    .pipe(notify("CSS task completed."));
});

/**
 * Running Jekyll via Gulp.
 */
gulp.task('jekyll', () => {
  const jekyll = child.spawn('jekyll', ['build',
    '--watch',
    '--incremental',
    '--drafts'
  ]);
  const jekyllLogger = (buffer) => {
    buffer.toString()
      .split(/\n/)
      .forEach((message) => gutil.log('Jekyll: ' + message));
  };
  // log to the console, as Jekyll would normally.
  jekyll.stdout.on('data', jekyllLogger);
  jekyll.stderr.on('data', jekyllLogger);
});

/**
 * Use LiveReload to serve site instead of Jekyll.
 */
gulp.task('serve', () => {
  browserSync.init({
    files: [siteRoot + '/**'],
    port: 4000,
    server: {
      baseDir: siteRoot
    }
  });

  // rebuild files as changes occur
  gulp.watch(cssFiles, gulp.parallel('css'));
  gulp.watch(siteRoot + '/**/*.*').on('change', browserSync.reload);
});

/**
 * Push build to gh-pages branch in GitHub.
 */
gulp.task('deploy', () => {
  return gulp.src("./_site/**/*")
         .pipe(deploy())
         .pipe(notify("Site deployed to GitHub Pages."));
});

gulp.task('default', gulp.parallel('css', 'jekyll', 'serve'));
