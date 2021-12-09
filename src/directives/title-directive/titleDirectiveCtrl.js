module.exports = function (app) {
    app.controller('titleDirectiveCtrl', function ($element, titleService, $timeout, $compile, $scope) {
        'ngInject';
        var self = this;
        self.service = titleService;
    });
};