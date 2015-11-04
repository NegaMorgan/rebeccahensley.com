'use strict';

var gulp = require('gulp'),
  wiredep = require('wiredep').stream,
  bs = require('browser-sync').create(),
  reload = bs.reload,
  lazypipe = require('lazypipe'),
  gp = require('gulp-load-plugins')({
    rename: {
      'gulp-image-resize': 'resize'
    }
  });

var Paths = {
  HERE                 : './',
  DIST                 : 'dist',
  DIST_TOOLKIT_JS      : 'dist/toolkit.js',
  LESS_TOOLKIT_SOURCES : 'src/less/toolkit*',
  LESS                 : './less/**/**'
}

// lint js with jshint, combine all files into one,
// write a minified and unminified version of file
gulp.task('javascript', function(){
  return gulp.src('src/js/*.js')
    .pipe(gp.jshint())
    .pipe(gp.jshint.reporter('default'))
    .pipe(gp.concat('toolkit.js'))
    .pipe(gulp.dest('dist/js'))
    .pipe(gp.rename({ suffix: '.min' }))
    .pipe(gp.uglify())
    .pipe(gulp.dest('dist/js'));
});

// css preprocessing
gulp.task('less', function () {
  return gulp.src(Paths.LESS_TOOLKIT_SOURCES)
    .pipe(gp.sourcemaps.init())
    .pipe(gp.less())
    .pipe(gp.autoprefixer())
    .pipe(gp.sourcemaps.write(Paths.HERE))
    .pipe(gulp.dest('dist/assets/css'))
})

gulp.task('less-min', ['less', 'css'], function () {
  return gulp.src(Paths.LESS_TOOLKIT_SOURCES)
    .pipe(gp.sourcemaps.init())
    .pipe(gp.less())
    .pipe(gp.autoprefixer())
    .pipe(gp.csso())
    .pipe(gp.rename({ suffix: '.min' }))
    .pipe(gp.sourcemaps.write(Paths.HERE))
    .pipe(gulp.dest('dist/assets/css'))
})

// for non-less style sources
gulp.task('css', function () {
  return gulp.src('src/assets/css/*')
    .pipe(gp.sourcemaps.init())
    .pipe(gulp.dest('dist/assets/css'))
    .pipe(gp.csso())
    .pipe(gp.rename({ suffix: '.min' }))
    .pipe(gp.sourcemaps.write(Paths.HERE))
    .pipe(gulp.dest('dist/assets/css'))
})

// image minification for below tasks
var optimizeHeavy = lazypipe()
    .pipe(gp.imagemin, {
      optimizationLevel: 5, 
      progressive: true, 
      interlaced: true 
    })

// generate large bg images in various sizes
// 2x = 2560px, 1x = 1280px, default is 768px, set below
gulp.task('backgrounds-2x', function() {
  return gulp.src('src/assets/img/backgrounds/*')
    .pipe(gp.rename({ suffix: '-2x' }))
    .pipe(optimizeHeavy())
    .pipe(gulp.dest('dist/assets/img'));
});

gulp.task('backgrounds-1x', function() {
  return gulp.src('src/assets/img/backgrounds/*')
    .pipe(gp.rename({ suffix: '-1x' }))
    .pipe(gp.resize({ 
      width : 1280,
      upscale : false,
      imageMagick: true
    }))
    .pipe(optimizeHeavy())
    .pipe(gulp.dest('dist/assets/img'));
});

gulp.task('backgrounds', ['backgrounds-2x', 'backgrounds-1x'], function() {
  return gulp.src('src/assets/img/backgrounds/*')
    .pipe(gp.resize({ 
      width : 768,
      upscale : false,
      imageMagick: true
    }))
    .pipe(gp.imagemin({
      optimizationLevel: 1, 
      progressive: true, 
      interlaced: true 
    }))
    .pipe(gulp.dest('dist/assets/img'));
});

gulp.task('images', ['backgrounds'], function() {
  return gulp.src(['src/assets/img/*', '!src/assets/img/backgrounds{,/**}'])
    .pipe(optimizeHeavy())
    .pipe(gulp.dest('dist/assets/img'));
});

// copy over html files, use bower to include libraries
gulp.task('html', function(){
  return gulp.src('src/*.html')
    .pipe(wiredep({
      cwd: './dist',
      ignorePath: '../dist'
    }))
    .pipe(gulp.dest('dist'));
});

// copy over fonts
gulp.task('fonts', function(){
  return gulp.src('src/assets/fonts/*')
    .pipe(gulp.dest('dist/assets/fonts'));
});

// clean out dist, in case sources have been removed
gulp.task('clean', require('del').bind(null, ['dist/assets', 'dist/js']));

gulp.task('watch', function(){
  gulp.watch('src/js/*.js', ['javascript', reload]);
  gulp.watch('src/less/*', ['less-min', reload]);
  gulp.watch('src/assets/fonts/*', ['fonts', reload]);
  gulp.watch('src/assets/img/**/*', ['images', reload]);
  gulp.watch('src/*.html', ['html', reload]);
});

// executing tasks from the dependency array is preferred
gulp.task('build', ['javascript', 'less-min', 'images', 'fonts', 'html'], function(){
  return gulp.src('dist/**/*')
  .pipe(gp.size({ title: 'build', gzip: true }));
});

// start browsersync, start watch task to watch for changes
gulp.task('serve', ['build'], function(){
  bs.init({ server: './dist/' });
  gulp.start('watch');
});

// clean task should be synchronous
gulp.task('default', ['clean'], function () {
  gulp.start('build');
});