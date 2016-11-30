const is = require('check-more-types')

function isGitHub (s) {
  return s.indexOf('github') !== -1
}

function isRepoUrl (s) {
  return (is.git(s) || is.url(s)) && isGitHub(s)
}

module.exports = isRepoUrl
