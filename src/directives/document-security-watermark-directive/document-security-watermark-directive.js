module.exports = function (app) {
    require('./document-security-watermark-style.scss');
    app.directive('documentSecurityWatermarkDirective', function ($timeout) {
        'ngInject';
        return {
            template: require('./document-security-watermark-tempate.html'),
            controller: 'documentSecurityWatermarkDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            replace: true,
            scope: {
                globalSetting: '=',
                globalSettingCopy: '='
            }
        }
    })
};