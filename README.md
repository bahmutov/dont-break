# dont-break

Checks if the node module in the current folder breaks unit tests for specified dependent projects.

[Relevant discussion at npm](https://github.com/npm/npm/issues/6510),
[Do not break dependant modules](http://glebbahmutov.com/blog/do-not-break-dependant-modules/).

[![NPM][dont-break-icon] ][dont-break-url]

[![Build status][dont-break-ci-image] ][dont-break-ci-url]
[![dependencies][dont-break-dependencies-image] ][dont-break-dependencies-url]
[![devdependencies][dont-break-devdependencies-image] ][dont-break-devdependencies-url]

[dont-break-icon]: https://nodei.co/npm/dont-break.png?downloads=true
[dont-break-url]: https://npmjs.org/package/dont-break
[dont-break-ci-image]: https://travis-ci.org/bahmutov/dont-break.png?branch=master
[dont-break-ci-url]: https://travis-ci.org/bahmutov/dont-break
[dont-break-dependencies-image]: https://david-dm.org/bahmutov/dont-break.png
[dont-break-dependencies-url]: https://david-dm.org/bahmutov/dont-break
[dont-break-devdependencies-image]: https://david-dm.org/bahmutov/dont-break/dev-status.png
[dont-break-devdependencies-url]: https://david-dm.org/bahmutov/dont-break#info=devDependencies

## Install

    npm install -g dont-break

## Use

* Create `.dont-break` file in the root of your package, list module names (one per line) that you would like
to test.
* Run `dont-break` any time to test latest version of each dependent module against the curent code

Picking projects to test manually is a judgement call. Dont-break can fetch top N most downloaded
or most starred dependent modules and save the list.
* run `dont-break --top-downloads <N>` to find top N most downloaded dependent modules,
save to `.dont-break` and check. This will overwrite `.dont-break` file.
* run `dont-break --top-starred <N>` to find top N most starred dependent modules,
save to `.dont-break` and check.

## Example

2 projects.

1. First project `foo` only exports single variable `module.exports = 'foo';`
2. Second project `foo-user` depends on `foo`.

`foo-user` only works if it gets string `foo` from the module it depends on, like this:

    var str = require('foo');
    console.assert(str === 'foo', 'value of foo should be "foo", but is ' + str);

`foo` has only a single release 0.1.0 that works for `foo-user` project.

The author of `foo` changes code to be `module.exports = 'bar';` and releases it as 0.2.0.
`foo-user` wants to use the latest `foo` so it updates its dependency, not expecting anything
bad - foo's minor version number has been upgraded. In semantic versioning it means no breaking API
changes.

`foo-user` is now broken!

Instead, before publishing new version to NPM, project `foo` can create a file in its
project folder `.dont-break` with names of dependent projects to test

    echo foo-user > .dont-break

You can check if the current code breaks listed dependent project by running

    dont-break

This will install each dependent project from `.dont-break` file into `/tmp/dont-break...` folder,
will run the dependent's unit tests using `npm test` to make sure they work initially, then
will copy the current project into the temp folder, overwriting the previous working version.
Then it will run the tests again, throwing an exception if they stopped working.

In the example case, it will report something like this

    $ dont-break
    dependents [ 'foo-user' ]
    testing foo-user
      installing foo-user
    installed into /tmp/foo@0.0.0-against-foo-user
      npm test
    tests work in /tmp/foo@0.0.0-against-foo-user/lib/node_modules/foo-user
    copied /Users/gleb/git/foo/* to /tmp/foo@0.0.0-against-foo-user/lib/node_modules/foo-user/node_modules/foo
      npm test
    npm test returned 1
    test errors:
    AssertionError: value of foo should be "foo", but is bar
    npm ERR! Test failed.  See above for more details.
    npm ERR! not ok code 0
    tests did not work in /tmp/foo@0.0.0-against-foo-user/lib/node_modules/foo-user
    code 1
    FAIL: Current version break dependents

The message clearly tells you that the dependent projects as they are right now cannot
upgrade to the version you are about to release.

## Custom test command

You can specify a custom test command per dependent module. Separate the name of the module
from the test command using `:` For example, to run `grunt test` for `foo-module-name`,
but default command for module `bar-name`, list in `.dont-break` the following:

    foo-module-name: grunt test
    bar-name

You can also specify a longer installation time out, in seconds, using CLI option

    dont-break --timeout 30

## Related

*dont-break* is the opposite of [next-update](https://github.com/bahmutov/next-update)
that one can use to safely upgrade dependencies.

## Setting up second CI for dont-break

I prefer to use a separate CI service specifically to test the current code
against the dependent projects using `dont-break`. For example, the project
[boggle](https://www.npmjs.com/package/boggle) is setup this way. The unit tests
are run on [TravisCI](https://travis-ci.org/bahmutov/boggle) using
pretty standard [.travis.yml](https://github.com/bahmutov/boggle/blob/master/.travis.yml) file

    language: node_js
    node_js:
      - "0.12"
      - "4"
    branches:
      only:
        - master
    before_script:
      - npm install -g grunt-cli

Then I setup a separate build service on [CircleCi](https://circleci.com/gh/bahmutov/boggle)
just to run the `npm run dont-break` command from the `package.json`

    "scripts": {
        "dont-break": "dont-break --timeout 30"
    }

We are assuming a global installation of `dont-break`, and the project lists
the projects to check in the
[.dont-break](https://github.com/bahmutov/boggle/blob/master/.dont-break) file.
At the present there is only a single dependent project
[boggle-connect](https://www.npmjs.com/package/boggle-connect).

To run `dont-break` on CircleCI, I created the
[circle.yml](https://github.com/bahmutov/boggle/blob/master/circle.yml) file.
It should be clear what it does - installs `dont-break`, and runs the npm script command.

    machine:
      node:
        version: "0.12"
    dependencies:
      post:
        - npm install -g dont-break
    test:
      override:
        - npm run dont-break

To make the status visible, I included the CircleCI badges in the README file.

```md
[![Dont-break][circle-ci-image] ][circle-ci-url]
[circle-ci-image]: https://circleci.com/gh/bahmutov/boggle.svg?style=svg
[circle-ci-url]: https://circleci.com/gh/bahmutov/boggle
```

which produces the following:

Breaking dependencies? [![Dont-break][circle-ci-image] ][circle-ci-url] using
[dont-break](https://github.com/bahmutov/dont-break)

[circle-ci-image]: https://circleci.com/gh/bahmutov/boggle.svg?style=svg
[circle-ci-url]: https://circleci.com/gh/bahmutov/boggle

## Development and testing

This project is tested end to end using two small projects:
[boggle](https://www.npmjs.com/package/boggle) and its dependent
[boggle-connect](https://www.npmjs.com/package/boggle-connect).

To see open github issues, use command `npm run issues`

### Small print

Author: Gleb Bahmutov &copy; 2014

* [@bahmutov](https://twitter.com/bahmutov)
* [glebbahmutov.com](http://glebbahmutov.com)
* [blog](http://glebbahmutov.com/blog)

License: MIT - do anything with the code, but don't blame me if it does not work.

Spread the word: tweet, star on github, etc.

Support: if you find any problems with this module, email / tweet /
[open issue](https://github.com/bahmutov/dont-break/issues?state=open) on Github

Implemented using [npm-registry](https://github.com/3rd-Eden/npmjs),
[lazy-ass](https://github.com/bahmutov/lazy-ass) and [npm-utils](https://github.com/bahmutov/npm-utils).

## MIT License

Copyright (c) 2014 Gleb Bahmutov

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
