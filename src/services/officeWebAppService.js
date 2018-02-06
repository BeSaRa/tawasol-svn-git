module.exports = function (app) {
    app.service('officeWebAppService', function (urlService,
                                                 dialog,
                                                 cmsTemplate,
                                                 $http,
                                                 $q,
                                                 generator,
                                                 _) {
        'ngInject';
        var self = this;

        self.serviceName = 'officeWebAppService';

        /**
         * prepare document template
         * @param template
         * @param placeholders
         */
        self.getTemplateToPrepare = function (template, placeholders) {
            console.log("PlaceHolders", placeholders);
            var vsId = template.hasOwnProperty('vsId') ? template.vsId : template;
            return $http.put(urlService.prepareTemplate.replace('{{vsId}}', vsId).replace('{{classDescription}}', placeholders.classDescription.toLowerCase()), placeholders)
                .then(function (result) {
                    return result.data.rs;
                });
        };
        /**
         * display template to prepare
         * @param templates
         * @param $event
         * @return {promise}
         */
        self.displayTemplates = function (templates, $event) {
            return dialog.showDialog({
                template: cmsTemplate.getPopup('prepare-template'),
                controller: 'prepareTemplatePopCtrl',
                controllerAs: 'ctrl',
                bindToController: true,
                targetEvent: $event,
                locals: {
                    templates: templates
                }
            });
        }


    });
};
