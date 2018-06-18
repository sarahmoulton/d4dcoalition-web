/*jshint esversion: 6 */

/* HT: https://aaronlasseigne.com/2016/02/03/using-gulp-with-jekyll/ */
/* HT: https://medium.com/superhighfives/deploying-to-github-pages-with-gulp-c06efc527de8 */

const child         = require('child_process');
const browserSync   = require('browser-sync').create();
const del           = require('del');
const exec          = child.exec;
const path          = require('path');

const gulp          = require('gulp');
const ghpages       = require('gh-pages');
const concat        = require('gulp-concat');
const sass          = require('gulp-sass');
const gutil         = require('gulp-util');
const autoprefixer  = require('gulp-autoprefixer');
const cleanCSS      = require('gulp-clean-css');
const notify        = require("gulp-notify");
const plumber       = require("gulp-plumber");
const imagemin      = require('gulp-imagemin');
const rename        = require('gulp-rename');
const uglify        = require('gulp-uglify');
const source        = require('vinyl-source-stream');
const read          = require('read-yaml');

const siteRoot  = '_site';
const cssFiles  = '_sass/**/*.?(s)css';

/**
 * Process SASS and concatenate all CSS files into a single file.
 */
gulp.task('styles', () => {
  return gulp.src(cssFiles)
    .pipe(plumber())
    .pipe(sass())
    .pipe(autoprefixer({
        browsers: ['last 2 versions'],
        cascade: false
    }))
    .pipe(cleanCSS({}))
    .pipe(gulp.dest('assets/css/'))
    .pipe(notify({message:"CSS optimization completed.",onLast:true}));
});

/**
 * Process JavaScript
 * @todo need to actually add source order before we can use scripts.min.js...
 */
gulp.task('scripts', function() {
  return gulp.src([
    'assets/js/jquery.min.js',
    'assets/js/jquery.dropotron.min.js',
    'assets/js/jquery.scrollex.min.js',
    'assets/js/jquery.scrolly.min.js',
    'assets/js/skel.min.js',
    'assets/js/util.js',
    'assets/js/main.js',
  ])
  .pipe(concat('scripts.js'))
  .pipe(gulp.dest('assets/js/'))
  .pipe(rename('scripts.min.js'))
  .pipe(uglify())
  .pipe(gulp.dest('assets/js/'));
});

/**
 * Compress Images
 * We are just overwriting the originals with the lossless optimized versions.
 * Ultimately, we need a better way to handle files that are part of
 * .site given we can't just write to that folder as Jekyll
 * overwrites it frequently.
 */
gulp.task('img', () => {
  return gulp.src('assets/img/**')
    .pipe(plumber())
    .pipe(imagemin())
    .pipe(gulp.dest('assets/img/'))
    .pipe(notify({message:"Image optimization completed.",onLast:true}));
});

/**
 * Running Jekyll via Gulp.
 */
gulp.task('jekyll', () => {
  const jekyll = child.spawn('bundle', [
    'exec',
    'jekyll',
    'build',
    '--drafts',
    '--watch',
    '--incremental'
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
  // Add a delay to the server setup so Jekyll has time to build.
  setTimeout(() => {
    browserSync.init({
      files: [siteRoot + '/**'],
      port: 4000,
      server: {
        baseDir: siteRoot
      }
    });

    // rebuild files as changes occur
    gulp.watch(cssFiles, gulp.parallel('styles'));
    gulp.watch(siteRoot + '/**/*.*').on('change', browserSync.reload);

  }, 3000);
});

/**
 * Cleanup build
 * We are occasionally seeing wonky build behavior; so let's be tidy.
 */
gulp.task('clean:site', () => {
  return del([siteRoot]);
});

/**
 * Production build
 * Build using the production environment var to ensure correct configuration.
 */
gulp.task('build:production', () => {
  return exec('JEKYLL_ENV=production bundle exec jekyll build --config=_config.yml,_config.production.yml');
});

/**
 * Kanopi build
 * Build using the Kanopi environment var to ensure correct configuration.
 */
gulp.task('build:kanopi', () => {
  return exec('JEKYLL_ENV=kanopi bundle exec jekyll build --config=_config.yml,_config.kanopi.yml');
});

/**
 * Push build to gh-pages branch in GitHub.
 * Notification in callback isn't working correctly but
 * I'm going to let it go for now.
 */
 gulp.task('publish', (cb) => {
   return ghpages.publish(path.join(process.cwd(), '_site'), ()=> {});
 });

/**
 * CNAME file creation
 * GitHub Pages requires a CNAME file in the gh-pages branch root to use
 * an external domain for hosting. We're writing this as part of the build
 * script since the branch gets wiped every time it is deployed.
 */
 gulp.task('publish:cname', () => {
    // we are storing the site name in _config.yml, so we'll leverage that
    // rather than hard-code something here.
    let stream = source('CNAME');
    let config = read.sync('_config.yml');

    stream.end(config.url);
    return stream.pipe(gulp.dest('_site'));
});

gulp.task('deploy', gulp.series('clean:site','build:production', 'publish:cname','publish'));

gulp.task('deploy:kanopi', gulp.series('clean:site','build:kanopi','publish'));

gulp.task('default', gulp.series('clean:site', gulp.parallel('styles', 'scripts'), gulp.parallel('jekyll', 'serve')));
