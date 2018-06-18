# Design4Democracy


## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

Your system must have the following command line utilities installed.

* [Jekyll](https://jekyllrb.com/docs/installation/)
* Gulp
* Node
* NPM

### Installing & Local Environment

```
$ cd design4democracy
$ bundle install
$ npm install
$ gulp
```

Visit http://localhost:4000/ (BrowserSync should automatically spawn this for you!)

## Deployment

`gulp deploy` will push the build artifacts out to the `gh-pages` branch of this repo.
**Please Note** that this command does _not_ commit to master. It will build the site locally using the production configuration, compress all images (lossless) and css/js, and deploy.

Production configuration is managed in the `_config.production.yml` file.

## Built With

* [Jekyll](https://jekyllrb.com/docs/) - Static site generator
* [Gulp](https://github.com/gulpjs/gulp/) - Task runner
