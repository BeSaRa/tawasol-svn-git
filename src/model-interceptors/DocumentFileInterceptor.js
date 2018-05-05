module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      lookupService,
                      documentFileService,
                      $location,
                      generator,
                      relatedOUDocumentFileService,
                      ouDocumentFileService,
                      organizationService) {
        'ngInject';
        var modelName = 'DocumentFile';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model
                .setDocumentFileService(documentFileService)
                .setOrganizationService(organizationService)
                .setOUDocumentFileService(ouDocumentFileService);
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.securityLevels = generator.getResultFromSelectedCollection(model.securityLevels, 'lookupKey');
            if (model.global)
                model.relatedOus = [];

            if (model.parent) {
                model.parent = model.parent.id;
            }
            delete model.relatedOus;
            delete model.children;
            return model;
        });
        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.getRelatedOUDocumentFiles();
            model.securityLevels = generator.getSelectedCollectionFromResult(lookupService.returnLookups(lookupService.securityLevel), model.securityLevels, 'lookupKey');
            model.getChildren();
            model.parent = documentFileService.getDocumentFileById(model.parent);
            return model;
        });
    })
};