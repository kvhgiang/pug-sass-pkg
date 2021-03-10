// Full options : https://github.com/sass/node-sass
const sass = {
  precision: 3,
  includePaths: ['.'],
  onError: console.error.bind(console, 'Sass error:')
}

// Full options : https://www.npmjs.com/package/gulp-html-beautify
// except "inline":[], this is special, break inline tags like a/img/span/... in new line
const htmlOpts = {
  "indent_size": 2,
  "indent_char": " ",
  "wrap_line_length": 80,
  "inline":[]
}

// Full options : https://github.com/postcss/autoprefixer#options
const autoprefixer = {
  browsers: ['last 4 versions'],
  grid: 'autoplace' //enable Autoprefixer grid translations and include autoplacement support.
}

exports.default = {
  sass,
  htmlOpts,
  autoprefixer
}