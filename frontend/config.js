exports.config = {
  // See http://brunch.io/#documentation for docs.
    conventions: {
        assets: /^app\/assets/
    },
   modules: {
    definition: false,
    wrapper: false
    },
  files: {
    javascripts: {
      joinTo: {
        'javascripts/app.js': /^app/,
        'javascripts/vendor.js': /^vendor/,
      },
      order: {
        before: [
          'vendor/ghetto-bower/jquery-2.0.3.min.js',
        ]
      },
    },
    stylesheets: {
      joinTo: {
        'css/app.css': /^(app|vendor)/
      }
    },
    templates: {
      joinTo: {
        'js/templates.js': /.+\.jade$/
      }
    }
	},
  plugins: {
    jade: {
      pretty: true
    }
	},
    paths:{
        public: '../backend/public/'
    }
}
