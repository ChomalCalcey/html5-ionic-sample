(function() {
  'use strict';

  angular
    .module('starter')
    .config(routeConfig);

  /** @ngInject */
  function routeConfig(
    $ionicConfigProvider,
    $stateProvider,
    $urlRouterProvider) {

    $urlRouterProvider.otherwise('/main');

    $stateProvider
    .state('main', {
      url: '/main',
      templateUrl: 'pages/main/main.html',
      controller: 'MainController as main'
    });
  };
})();
