module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      lookupService,
                      documentFileService,
                      $location,
                      generator,
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

            model.parent = (model.parent && model.parent.hasOwnProperty('id')) ? model.parent.id : model.parent;
            delete model.relatedOus;
            delete model.children;
            return model;
        });
        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.securityLevels = generator.getSelectedCollectionFromResult(lookupService.returnLookups(lookupService.securityLevel), model.securityLevels, 'lookupKey');
            if (model.global){
                model.relatedOus = [];
            }
            model.getChildren();
            //model.parent = documentFileService.getDocumentFileById(model.parent);
            model.parent = angular.copy(documentFileService.getDocumentFileById(model.parent)) || model.parent;
            /*if (model.parent)
                delete model.parent.children;*/
            return model;
        });
    })
};
