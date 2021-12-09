module.exports = function (app) {
    app.directive('wrapperDirective', function () {
        'ngInject';
        return {
            restrict: 'A',
            controller: function ($timeout) {
                'ngInject';
                var self = this;
                self.loadedComplete = false;
                $timeout(function () {
                    self.loadedComplete = true;
                }, 1000);
            },
            controllerAs: 'ctrl',
            bindToController: true
        }
    })
};