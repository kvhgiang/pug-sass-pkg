let gulp = require('gulp'),
    sass = require('gulp-sass'),
    gulpif = require('gulp-if'),
    autoprefixer = require('gulp-autoprefixer'),
    csso = require('gulp-csso'),
    pug = require('gulp-pug'),
    babel = require('gulp-babel'),
    uglify = require('gulp-uglify'),
    htmlbeautify = require('gulp-html-beautify'),
    fs = require('fs'),
    concat = require('gulp-concat'),
    browserSync = require('browser-sync').create(),
    gulpImagemin = require('gulp-imagemin'),
    imageminPngquant = require('imagemin-pngquant'),
    imageminJpegRecompress = require('imagemin-jpeg-recompress'),
    gulpZip = require('gulp-zip'),
    data = require('gulp-data'),
    path = require('path'),
    merge = require('gulp-merge-json'),
    del = require('del'),
    sourcemaps = require('gulp-sourcemaps'),
    icofont = require('gulp-iconfont');

const MODE = () => process.env.NODE_ENV;
const DIST = () => MODE() || 'dev';

// Declare parameters
const CONFIG       = require('./config/options').default,
      PORT         = process.env.port || 2010,
      SASS_OPTIONS = CONFIG.sass,
      HTML_OPTIONS = CONFIG.htmlOpts,
      AUTOPREFIXER = CONFIG.autoprefixer,
      PROJECT      = process.env.project_name || 'archive'
      ;


// Task for compile & minify the main sass file
gulp.task('sass', function() {
  return gulp.src('./src/scss/*.scss')
      // Init sourcemaps
      .pipe(gulpif(!MODE(), sourcemaps.init()))
      // Compile sass file
      .pipe(sass(SASS_OPTIONS))
      // Autoprefix css for cross browser compatibility
      // .pipe(postcss([ autoprefixer(AUTOPREFIXER) ]))
      .pipe(autoprefixer(AUTOPREFIXER))
      // Minify css
      .pipe(gulpif(!!MODE(), csso({
        restructure:true,
        forceMediaMerge: true,
      })))
      // .pipe(csso({
      //   restructure:true,
      //   forceMediaMerge: true,
      // }))
      // Write down sourcemaps 
      .pipe(gulpif(!MODE(), sourcemaps.write('.')))
      // Ouptut css
      .pipe(gulp.dest(`./${DIST()}/assets/css`))
});


// Task for create data for pug files
gulp.task('pug:data', function () {
  return gulp
      .src('./src/data/includes/*.json')
      .pipe(merge({
          fileName: 'data.json',
          edit: (json, file) => {
              // Extract the filename and strip the extension
              var filename = path.basename(file.path),
                  primaryKey = filename.replace(path.extname(filename), '');
              // Set the filename as the primary key for our JSON data
              var data = {};
              data[primaryKey.toUpperCase()] = json;
              return data;
          }
      }))
      .pipe(gulp.dest(`./src/data/`));
});

// Task for compile the pug files
gulp.task('pug', function() {
  return gulp.src('./src/pugs/*.pug')
      // Data
      .pipe(data(function() {
          return JSON.parse(fs.readFileSync(`./src/data/data.json`))
      }))
      // Compile pug file
      // pug pretty can't break inline tags [a, img, span,...]
      // => use gulp-html-beautify
      .pipe(pug())
      .pipe(htmlbeautify(HTML_OPTIONS))
      .pipe(gulp.dest(`./${DIST()}`))
});

// Task for compress & minify the image files
gulp.task('imgs', function() {
  return gulp.src([
    './src/img/**/*'
    ])
    // Compress & minify the image files
    .pipe(gulpif(MODE(), gulpImagemin([
        gulpImagemin.gifsicle(),
        gulpImagemin.jpegtran(),
        gulpImagemin.optipng(),
        gulpImagemin.svgo(),
        imageminPngquant(),
        imageminJpegRecompress(),
    ])))
    // Ouptut css
    .pipe(gulp.dest(`./${DIST()}/assets/images`))
    // .pipe(gulpif(!MODE, browserSync.stream()));
});

// Task for create icon font from svg
var runTimestamp = Math.round(Date.now()/1000);
 
gulp.task('icofont', function(){
  return gulp.src(['./src/icons/*.svg'])
    .pipe(icofont({
      fontName: 'iconsfont', // required
      prependUnicode: true, // recommended option
      formats: ['svg', 'ttf', 'eot', 'woff', 'woff2'], // default, 'woff2' and 'svg' are available
      timestamp: runTimestamp, // recommended to get consistent builds when watching files
    }))
    .pipe(gulp.dest(`./${DIST()}/assets/fonts`));
});

// Move the javascript files into our /src/js folder
gulp.task('js', function() {
  return gulp.src(['./src/js/**/*.js'])
      // Concat all file
      .pipe(concat(`script.js`))
      // Babel compiler
      .pipe(babel({
          presets: ['@babel/env']
      }))
      // Minify the js files        
      .pipe(gulpif(MODE(), uglify()))
      // Output js
      .pipe(gulp.dest(`./${DIST()}/assets/js/`))
      .pipe(gulpif(!MODE(), browserSync.stream()));
});

// Clear all before run app
gulp.task('clean:all', function(callback) {
  // del.sync([DIST(), '!build/.gitignore', '!build/README.md']);
  del.sync([`${DIST()}/**`, `!${DIST()}`, `!${DIST()}/.gitignore`, `!${DIST()}/README.md`], `!${DIST()}/.git/**/*`);
  callback();
});

// Copy all assets which don't need to be build
gulp.task('copy:all', function() {
  return gulp
    .src([
      './src/**/*',
      '!./src/data','!./src/data/**/*',
      '!./src/img','!./src/img/**/*',
      '!./src/js','!./src/js/**/*',
      '!./src/pugs','!./src/pugs/**/*',
    ])
    .pipe(gulp.dest(`./${DIST()}/assets/`));
});

const basicTasks = [
  'clean:all',
  'copy:all',
  'sass',
  'pug:data',
  'pug',
  'imgs',
  'icofont',
  'js'
];

// Task export - `gulp export` into terminal for exporting the project
gulp.task('export', gulp.series(
  gulp.series(...basicTasks),
  async function() {
      let date = new Date();
      let d = date.getDate().toString();
      let m = (date.getMonth() + 1).toString();
      let y = date.getFullYear().toString();
      let h = date.getHours().toString();
      let mi = date.getMinutes().toString();
      let stringDate = `${d.length > 1 ? '' : '0'}${d}${m.length > 1 ? '' : '0'}${m}${y}_${h.length > 1 ? '' : '0'}${h}${mi.length > 1 ? '' : '0'}${mi}`;
      return gulp.src(`./${DIST()}/**/*`)
          .pipe(gulpZip(`${PROJECT.replace(/ /gi, '_').toLowerCase()}-${stringDate}.zip`))
          .pipe(gulp.dest('./exported'));
  }
));

gulp.task('set-prod-node-env', function(done) {
  process.env.NODE_ENV = 'build';
  return done();
});



// Task build - `gulp build` into terminal for building the project
gulp.task('build', gulp.series(
  'set-prod-node-env',
  ...basicTasks
));

// Default task - run the `gulp serve` when type only `gulp`
gulp.task('default', gulp.series(...basicTasks, function() {
  browserSync.init({
    server: `./${DIST()}`,
    port: PORT
  });

  gulp.watch('./src/scss/**/*', gulp.series('sass'));
  gulp.watch('./src/js/**/*', gulp.series('js'));
  gulp.watch('./src/pugs/**/*', gulp.series('pug'));
  gulp.watch('./src/img/**/*', gulp.series('imgs'));
  gulp.watch('./src/icons/*', gulp.series('icofont'));
  gulp.watch('./src/data/includes/*', gulp.series('pug:data', 'pug'));
  gulp.watch(`./${DIST()}/**/*`).on('change', browserSync.reload);
}));