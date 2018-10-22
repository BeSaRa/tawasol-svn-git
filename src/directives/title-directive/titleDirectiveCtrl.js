module.exports = function (app) {
    app.controller('titleDirectiveCtrl', function ($element, titleService, $timeout, $compile, $scope) {
        'ngInject';
        var self = this;
        self.service = titleService;

        $timeout(function () {
            titleService.setTitle("CMS PACKAGING");
        }, 1000);

    });
};