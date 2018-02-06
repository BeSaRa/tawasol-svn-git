module.exports = function (app) {
    app.controller('titleDirectiveCtrl', function ($element, titleService, $timeout, $compile, $scope) {
        'ngInject';
        var self = this;
        self.service = titleService;

        $timeout(function () {
            titleService.setTitle("CMS PACKAGING");
        }, 1000);

        // {{titleCtrl.service.prefix}} {{titleCtrl.service.title}} {{titleCtrl.service.suffix}}

        // $compile($element.html('<span>{{titleCtrl.service.prefix}} {{titleCtrl.service.title}} {{titleCtrl.service.suffix}}</span>'))($scope);

    });
};