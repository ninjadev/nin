exports.config =
  # See http://brunch.io/#documentation for docs.
  files:
    javascripts:
      joinTo:
        'javascripts/app.js': /^app/
        'javascripts/vendor.js': /^(bower_components|vendor)/
    stylesheets:
      joinTo:
        'css/app.css': /^(app|vendor|bower_components)/
    templates:
      joinTo: 'templates/app.js'