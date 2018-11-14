module.exports = function (app) {
    require('./grid-search-directive-style.scss');
    app.directive('gridSearchDirective', function () {
        'ngInject';
        return {
            restrict: "E",
            template: require('./grid-search-template.html'),
            replace: true,
            scope: {
                grid: '='
            },
            bindToController: true,
            controller: 'gridSearchDirectiveCtrl',
            controllerAs: 'ctrl'
        }
    })
};