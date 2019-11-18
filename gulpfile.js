var gulp = require('gulp');
var gutil = require('gulp-util');
var sass = require('gulp-sass');
var browserSync = require('browser-sync');
var useref = require('gulp-useref');
var uglify = require('gulp-uglify-es').default;
var gulpIf = require('gulp-if');
var cssnano = require('gulp-cssnano');
var imagemin = require('gulp-imagemin');
var cache = require('gulp-cache');
var del = require('del');
var runSequence = require('run-sequence');
var stripDebug = require('gulp-strip-debug');
var path = require('path');
var pump = require('pump');
var sourcemaps = require('gulp-sourcemaps');


// Development Tasks 
// -----------------

// Start browserSync server
gulp.task('browserSync', function() {
  browserSync({
    proxy: "http://localhost:5000" // port of node server
  })
})

gulp.task('uglify-error-debugging', function (cb) {
  pump([
    gulp.src('app_client/**/*.js'),
    uglify(),
    gulp.dest('./dist/')
  ], cb);
});

gulp.task('sass-build', function() {
  return gulp.src('app_client/scss/**/*.scss') // Gets all files ending with .scss in app_client/scss and children dirs
    .pipe(sass().on('error', sass.logError)) // Passes it through a gulp-sass, log errors to console
    .pipe(gulp.dest('app_client/css')) // Outputs it in the css folder
})

gulp.task('sass', function() {
  return gulp.src('app_client/scss/**/*.scss') // Gets all files ending with .scss in app_client/scss and children dirs
    .pipe(sass().on('error', sass.logError)) // Passes it through a gulp-sass, log errors to console
    .pipe(gulp.dest('app_client/css')) // Outputs it in the css folder
    .pipe(browserSync.reload({ // Reloading with Browser Sync
      stream: true
    }));
})

// Watchers
gulp.task('watch', function() {
  gulp.watch('app_client/scss/**/*.scss', ['sass']);
  gulp.watch('app_client/**/*.html', browserSync.reload);
  gulp.watch('app_client/js/**/*.js', browserSync.reload);
})

// Optimization Tasks 
// ------------------

// Optimizing CSS and JavaScript 
gulp.task('useref', function() {
  return gulp.src('app_client/**/*.html')
    .pipe(useref())
    .pipe(gulpIf('*.js', uglify()))
    .on('error', function (err) { gutil.log(gutil.colors.red('[Error]'), err.toString()); })
  //  .pipe(gulpIf('*.js', stripDebug()))
    .pipe(gulpIf('*.js', sourcemaps.write('.')))
    .pipe(gulpIf('*.css', cssnano()))
    .pipe(gulp.dest('public'));
});

gulp.task('copy-sounds', function () {
  gulp.src('./app_client/sounds/*')
      .pipe(gulp.dest('./public/sounds/'));
});

// Optimizing Images 
gulp.task('images', function() {
  return gulp.src('app_client/images/**/*.+(png|jpg|jpeg|gif|svg)')
    // Caching images that ran through imagemin
    .pipe(cache(imagemin({
      interlaced: true,
    })))
    .pipe(gulp.dest('public/images'))
});

gulp.task('copy-flags', function() {
  return gulp.src('app_client/bower_components/intl-tel-input/build/img/**/*.*')
    .pipe(gulp.dest('public/bower_components/intl-tel-input/build/img'));
});

// Copying fonts 
gulp.task('fonts', function() {
  return gulp.src('app_client/fonts/**/*')
    .pipe(gulp.dest('public/fonts'))
})

// Cleaning 
gulp.task('clean', function() {
  return del.sync('public').then(function(cb) {
    return cache.clearAll(cb);
  });
})

gulp.task('clean:public', function() {
  return del.sync(['public/**/*', '!public/images', '!public/images/**/*']);
});

// Build Sequences
// ---------------

gulp.task('default', function(callback) {
  runSequence(['sass', 'browserSync'], 'watch',
    callback
  )
})

gulp.task('build', function(callback) {
  runSequence(
    'clean:public',
    'sass-build',
    ['useref', 'images', 'fonts', 'copy-sounds', 'copy-flags'],
    callback
  )
})