var outline = require('./outline.js');

var gulp = require('gulp');
var gutil = require('gulp-util');
var bower = require('bower');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var sh = require('shelljs');
var jade = require('gulp-jade');
var templateCache = require('gulp-angular-templatecache');
var plumber = require('gulp-plumber');
var bowerFiles = require('main-bower-files');
var inject = require('gulp-inject');
var ngAnnotate = require('gulp-ng-annotate');
var uglify = require('gulp-uglify');
var watch = require('gulp-watch');
var ngConstant = require('gulp-ng-constant');
var gulpif = require('gulp-if');
var htmlreplace = require('gulp-html-replace');
var args = require('yargs')
           .alias('p', 'prod')
           .default('prod', false)
           .argv;

var paths = {
  ionicSass: ['./scss/**/*.scss'],
  sass: outline.src + '/**/*.scss',
  js: outline.src + "/**/*.js",
  jade: outline.src + "/**/*.jade",
  assets: outline.src + "/assets/**/*"
};

var indexInject = {
  templateCache: 'js/templates.js',
  jsBundle: "js/" + outline.name + ".min.js",
  cssBundle: "css/" + outline.name + ".min.css"
};

gulp.task('default', ['build', 'watch']);

gulp.task('ionic-sass', function(done) {
  gulp.src('./scss/ionic.app.scss')
    .pipe(sass())
    .on('error', sass.logError)
    .pipe(gulp.dest('./www/css/'))
    .pipe(minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest('./www/css/'))
    .on('end', done);
});

gulp.task('sass', function () {
  gulp.src([paths.sass])
  .pipe(plumber())
  .pipe(sass({outoutStyle: 'compressed'}))
  .pipe(concat(outline.name+".min.css"))
  .pipe(gulpif(args.prod, minifyCss()))
  .pipe(gulp.dest(outline.dist + "/css"));
});

gulp.task('watch', function() {
  watch(paths.ionicSass, function(){gulp.start('ionic-sass');});
  watch(paths.sass, function(){gulp.start('sass');});
  watch(paths.jade, function(){gulp.start('jade');});
  watch(paths.js, function(){gulp.start('scripts');});
  watch(paths.assets, function(){gulp.start('assets');});
});

gulp.task('config', function () {
  var constants = args.prod ? outline.constants.production : outline.constants.development;
  gulp.src('package.json')
  .pipe(concat('outline.json'))
  .pipe(ngConstant({name: "outline", constants: constants}))
  .pipe(gulp.dest(outline.dist + "/js/"));
});

gulp.task('scripts', ['config'], function () {
  gulp.src([outline.src + '/index.js', outline.dist + "/js/outline.js", paths.js])
  .pipe(plumber())
  .pipe(concat(outline.name + ".min.js"))
  .pipe(ngAnnotate())
  .pipe(gulpif(args.prod, uglify()))
  .pipe(gulp.dest(outline.dist + "/js"));
});

gulp.task('index', function () {
  gulp.src(outline.src + "/index.jade")
  .pipe(plumber())
  .pipe(jade({pretty: true}))
  .pipe(htmlreplace(indexInject))

  .pipe(inject(gulp.src(bowerFiles(), {read: false}), {
    name: 'bower',
    addRootSlash: false,
    ignorePath: "/" + outline.dist
  }))
  .pipe(gulp.dest(outline.dist));
});

gulp.task('jade', ['index'], function () {
  gulp.src([paths.jade, "!**/*/index.jade"])
  .pipe(plumber())
  .pipe(jade({pretty: true}))
  .pipe(templateCache({standalone: true}))
  .pipe(gulp.dest(outline.dist + "/js"));
});

gulp.task('assets', function () {
  gulp.src(paths.assets)
  .pipe(gulp.dest(outline.dist + "/assets"));
});

gulp.task('build', ['assets', 'jade', 'scripts', 'sass', 'ionic-sass']);