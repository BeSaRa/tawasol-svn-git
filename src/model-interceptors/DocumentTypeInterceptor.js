module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      DocumentType,
                      lookupService,
                      generator,
                      documentTypeService) {
        'ngInject';

        var modelName = 'DocumentType';


        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.setDocumentTypeService(documentTypeService);
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.lookupStrKey = generator.getResultFromSelectedCollectionDocumentClass(model.lookupStrKey);
            delete model.documentClassesString;
            delete model.relatedRecords;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            var documentClasses = lookupService.returnLookups(lookupService.documentClass);
            model.lookupStrKey = generator.getSelectedCollectionFromResultDocumentClass(documentClasses, model.lookupStrKey, 'lookupKey');
            model.documentClassesString = model.getDocumentClass();
            model.relatedRecords = []; // just set property in beginning to set initial paging of grid in popup
            return model;
        });


    })
};
