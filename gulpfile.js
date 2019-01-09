var gulp = require('gulp');
var sass = require('gulp-sass');
var browserSync = require('browser-sync');
var useref = require('gulp-useref');
var uglify = require('gulp-uglify');
var gulpIf = require('gulp-if');
var cssnano = require('gulp-cssnano');
var imagemin = require('gulp-imagemin');
var cache = require('gulp-cache');
var del = require('del');
var runSequence = require('run-sequence');
var stripDebug = require('gulp-strip-debug');

// Development Tasks 
// -----------------

// Start browserSync server
gulp.task('browserSync', function() {
  browserSync({
    server: {
      baseDir: 'app_client'
    }
  })
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
  gulp.watch('app_client/*.html', browserSync.reload);
  gulp.watch('app_client/js/**/*.js', browserSync.reload);
})

// Optimization Tasks 
// ------------------

// Optimizing CSS and JavaScript 
gulp.task('useref', function() {
  return gulp.src('app_client/**/*.html')
    .pipe(useref())
    .pipe(gulpIf('*.js', uglify()))
    .pipe(gulpIf('*.js', stripDebug()))
    .pipe(gulpIf('*.css', cssnano()))
    .pipe(gulp.dest('public'));
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
    'sass',
    ['useref', 'images', 'fonts'],
    callback
  )
})