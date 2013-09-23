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
        'javascripts/vendor.js': /^(bower_components|vendor)/
      }
    },
    stylesheets: {
      joinTo: {
        'css/app.css': /^(app|vendor|bower_components)/
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
  }
}
