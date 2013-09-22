exports.config =
  # See http://brunch.io/#documentation for docs.
  files:
    javascripts:
      joinTo:
        'javascripts/app.js': /^app/
        'javascripts/vendor.js': /^vendor/
    stylesheets:
      joinTo: 'stylesheets/app.css'
    templates:
      joinTo: 'templates/app.js'