module.exports = function (app) {
    require('./star-unstar-directive-style.scss');
    app.directive('starUnstarDirective', function () {
        'ngInject';
        return {
            restrict: 'E',
            template: require('./star-unstar-directive-template.html'),
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