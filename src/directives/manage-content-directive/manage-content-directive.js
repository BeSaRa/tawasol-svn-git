module.exports = function (app) {
    app.directive('manageContentDirective', function () {
        'ngInject';
        return {
            restrict: 'E',
            controller: 'manageContentDirectiveCtrl',
            controllerAs: 'ctrl',
            template: require('./manage-content-template.html'),
            bindToController: true,
            scope: {
                fromDialog: '=',
                editContent: '=',
                displayPrepare: '=',
                templates: '=',
                vsId: '=',
                documentClass: '=',
                document: '=?',
                documentInformation: '=',
                disableWhen: '=',
                signaturesCount: '=',
                simpleViewUrl: '=?',
                isSimpleAdd: '=?',
                receiveDocument: '=?'
            }
        }
    })
};