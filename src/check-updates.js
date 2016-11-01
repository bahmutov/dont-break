(function checkForUpdates () {
  var thisPackage = require('../package.json')
  require('update-notifier')({
    packageName: thisPackage.name,
    packageVersion: thisPackage.version
  }).notify()
}())
