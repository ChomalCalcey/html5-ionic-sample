(function() {
  'use strict';
  angular.module('starter', [
    'ionic',
    'starter.main'
  ])

    .run(['$ionicPlatform', function($ionicPlatform) {
      $ionicPlatform.ready(function() {
        // iPad Landscape standard keyboard height
        ionic.keyboard.height = 395;
      });
    }])

    .config(['$stateProvider', '$urlRouterProvider',
      function($stateProvider,
               $urlRouterProvider) {
        $stateProvider

          .state('app', {
            url: '/app',
            templateUrl: 'templates/main.html',
            controller: 'MainCtrl'
          });
        // if none of the above states are matched, use this as the fallback
        $urlRouterProvider.otherwise('/app');
      }]);
})();
