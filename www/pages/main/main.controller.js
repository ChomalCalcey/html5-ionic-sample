(function() {
  'use strict';

  angular
    .module('starter')
    .controller('MainController', MainController);

    /** @ngInject */
  function MainController() {
    var ctrl = this;

    ctrl.hello = 'HTML5 Ionic Sample';

  }
})();
