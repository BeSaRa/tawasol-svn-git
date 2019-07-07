module.exports = function (app) {
    app.directive('gridDocumentSubjectDirective', function (cmsTemplate) {
        'ngInject';
        return {
            templateUrl: cmsTemplate.getDirective('grid-document-subject-template.html'),
            controller: 'gridDocumentSubjectDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            replace: true,
            scope: {
                record: '=',
                clickCallback: '=?',
                textValue: '@?',
                textCallback: '@?',
                textProperty: '@?',
                plainTextOnly: '=?',
                skipTooltip: '=?',
                skipTruncate: '=?'
            },
            /*link: function (scope, elem, attrs, ctrl) {
                ctrl.getRecordText();
            }*/
        }
    })
};
