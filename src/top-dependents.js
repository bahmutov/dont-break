// TODO(gleb): move top dependents logic into separate file or module

require('lazy-ass');
var check = require('check-more-types');
var _ = require('lodash');
var Q = require('q');

var Registry = require('npm-registry');
var npm = new Registry();

var downloads = {};

function sortedByDownloads() {
  var list = _.pairs(downloads);
  // [[name, n], [name, n], ...]
  var sorted = _.sortBy(list, '1').reverse();
  // sorts by number, largest first
  var names = _.map(sorted, '0');
  return names;
}

function topDownloads(name) {
  la(check.unemptyString(name), 'invalid package name', name);
  return Q.ninvoke(npm.downloads, 'totals', 'last-week', name)
    .then(function statsToDownloads(stats) {
      la(check.array(stats) && stats.length === 1, 'expected single stats', stats);
      la(check.number(stats[0].downloads), 'invalid number of downloads', stats);

      var n = stats[0].downloads;
      downloads[name] = n;
      console.log(name, 'has been downloaded', n, 'times');
      return n;
    });
}

function topStarred(name) {
  la(check.unemptyString(name), 'invalid package name', name);
  return Q.ninvoke(npm.packages, 'starred', name)
    .then(function usersToStarred(users) {
      la(check.array(users), 'expected list of users that starred', name, 'not', users);
      var n = users.length;
      downloads[name] = n;
      console.log(name, 'has been starred', n, 'times');
      return n;
    });
}

function fetchDownloads(metric, name) {
  la(metric === 'downloads' || metric === 'starred', 'invalid metric', metric);
  la(check.unemptyString(name), 'invalid package name', name);
  return metric === 'downloads' ? topDownloads(name) : topStarred(name);
}

function fetchDownloadsForEachDependent(metric, dependents) {
  la(check.arrayOfStrings(dependents), 'invalid dependents', dependents);
  var actions = dependents.map(function (name) {
    return _.partial(fetchDownloads, metric, name);
  });
  console.log('preparing number of downloads for dependents', dependents.join(', '));

  var fetchSequence = actions.reduce(Q.when, Q());
  return fetchSequence;
}

function getTopDependents(name, n) {
  la(check.unemptyString(name), 'missing package name');
  la(check.positiveNumber(n), 'invalid top dependents to check', n);
  console.log('fetching top', n, 'dependent projects for', name);

  return Q.ninvoke(npm.packages, 'depended', name).then(function (dependents) {
    la(check.array(dependents),
      'expected modules dependent on', name, 'to be array', dependents);
    console.log('module', name, 'has', dependents.length, 'dependents');
    var names = _.pluck(dependents, 'name');
    return names;
  });
}

module.exports = {
  topDependents: getTopDependents,
  downloads: fetchDownloadsForEachDependent,
  sortedByDownloads: sortedByDownloads
};
