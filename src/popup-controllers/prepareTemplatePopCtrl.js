module.exports = function (app) {
    app.controller('prepareTemplatePopCtrl', function (dialog) {
        'ngInject';
        var self = this;
        self.controllerName = 'prepareTemplatePopCtrl';
        self.templateSearchText = null;

        self.sendTemplateToPrepare = function (template) {
            dialog.hide(template);
        }

    });
};
