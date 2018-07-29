module.exports = function (app) {
    app.directive('manageCorrespondenceSiteG2gDirective', function () {
        'ngInject';
        return {
            restrict: 'E',
            template: require('./manage-correspondence-site-g2g-template.html'),
            controller: 'manageCorrespondenceSiteG2GDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            scope: {
                //vsId: '=',
                //documentClass: '=',
                //emptySubRecords: '=',
                site: '=',
                //disableCorrespondence: '=?'
            }
        }
    });
};