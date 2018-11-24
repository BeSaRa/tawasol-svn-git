module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      DocumentFile,
                      organizationService,
                      generator) {
        'ngInject';

        var modelName = 'OUDocumentFile';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.ouid = model.ouid.hasOwnProperty('id') ? model.ouid.id : model.ouid;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            debugger;
            model.file = generator.interceptReceivedInstance('DocumentFile', new DocumentFile(model.file));
            model.ouid = organizationService.getOrganizationById(model.ouid);
            return model;
        });

    })
};