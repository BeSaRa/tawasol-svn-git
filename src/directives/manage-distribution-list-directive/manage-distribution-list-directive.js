module.exports = function (app) {
    app.directive('manageDistributionListDirective', function () {
        'ngInject';
        return {
            restrict: 'E',
            template: require('./manage-distribution-list-template.html'),
            controller: 'manageDistributionListDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            scope: {
                distributionListMembers: '='
            }
        }
    });
};