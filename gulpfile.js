var gulp = require('gulp');
var rename = require('gulp-rename');
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
var critical = require('critical').stream;

// Development Tasks 
// -----------------

// Start browserSync server
gulp.task('browserSync', function() {
  browserSync({
    server: {
      baseDir: 'src'
    }
  })
})

gulp.task('sass', function() {
  return gulp.src('src/assets/scss/**/*.scss') // Gets all files ending with .scss in app/scss and children dirs
    .pipe(sass().on('error', sass.logError)) // Passes it through a gulp-sass, log errors to console
    .pipe(gulp.dest('public/assets/css')) // Outputs it in the css folder
    .pipe(browserSync.reload({ // Reloading with Browser Sync
      stream: true
    }));
})

gulp.task('sass-dev', function() {
  return gulp.src('src/assets/scss/**/*.scss') // Gets all files ending with .scss in app/scss and children dirs
    .pipe(sass().on('error', sass.logError)) // Passes it through a gulp-sass, log errors to console
    .pipe(gulp.dest('src/assets/css')) // Outputs it in the css folder
    .pipe(browserSync.reload({ // Reloading with Browser Sync
      stream: true
    }));
})

// Watchers
gulp.task('watch', function() {
  gulp.watch('src/assets/scss/**/*.scss', ['sass-dev']);
  gulp.watch('src/*.html', browserSync.reload);
  gulp.watch('src/assets/js/**/*.js', browserSync.reload);
})

// Optimization Tasks 
// ------------------

// Optimizing CSS and JavaScript 
gulp.task('useref', function() {

  return gulp.src('src/*.html')
    .pipe(useref())
    .pipe(gulpIf('*.js', uglify()))
    .pipe(gulpIf('*.css', cssnano()))
    .pipe(gulp.dest('public'));
});

// Minify JS
gulp.task('minify-js', function() {
  return gulp.src(['./src/assets/js/**/*.js','!./src/assets/js/**/*.min.js', '!./src/assets/js/**/*-min.js'])
    .pipe(uglify())
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest('./public/assets/js'))
});

// Minify JS
gulp.task('copy-js', function() {
  return gulp.src(['./src/assets/js/**/*.min.js','./src/assets/js/**/*-min.js'])
    .pipe(gulp.dest('./public/assets/js'))
});

// Minify txt
gulp.task('copy-txt', function() {
  return gulp.src(['./src/*.txt'])
    .pipe(gulp.dest('./public'))
});

// Optimizing Images 
gulp.task('images', function() {
  return gulp.src('src/assets/img/**/*.+(png|jpg|jpeg|gif|svg)')
    // Caching images that ran through imagemin
    .pipe(cache(imagemin({
      interlaced: true,
    })))
    .pipe(gulp.dest('public/assets/img'))
});

// Copying fonts 
gulp.task('fonts', function() {
  return gulp.src('src/assets/css/fonts/**/*')
    .pipe(gulp.dest('public/assets/css/fonts'))
})

// Generate & Inline Critical-path CSS
gulp.task('critical', function () {
    return gulp.src('public/*.html')
        .pipe(critical({base: 'public/', inline: true, css: ['public/assets/css/main.min.css']}))
        .on('error', function(err) { log.error(err.message); })
        .pipe(gulp.dest('public'));
});

// Cleaning 
gulp.task('clean', function() {
  return del.sync('public').then(function(cb) {
    return cache.clearAll(cb);
  });
})

gulp.task('clean:dist', function() {
  return del.sync(['public/**/*', '!public/assets/img', '!public/assets/img/**/*']);
});

// Build Sequences
// ---------------

gulp.task('default', function(callback) {
  runSequence(['sass-dev', 'browserSync'], 'watch',
    callback
  )
})

gulp.task('build', function(callback) {
  runSequence(
    'clean:dist',
    'sass',
    ['useref', 'images', 'fonts', 'copy-txt'],
    'minify-js', 
    'copy-js',
    'critical',
    callback
  )
})