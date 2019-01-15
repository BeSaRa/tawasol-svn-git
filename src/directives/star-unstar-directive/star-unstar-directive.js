module.exports = function (app) {
    require('./star-unstar-directive-style.scss');
    app.directive('starUnstarDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            templateUrl: cmsTemplate.getDirective('star-unstar-directive-template.html'),
            controller: 'starUnstarDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            scope: {
                record: '=',
                recordType: '@',
                selectedRecords: '=',
                hideStar: '=?',
                callback: '='
            }
        }
    })
};
