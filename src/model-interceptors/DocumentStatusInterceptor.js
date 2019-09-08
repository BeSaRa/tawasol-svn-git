module.exports = function (app) {
    app.run(function (CMSModelInterceptor, 
                      lookupService, 
                      generator) {
        'ngInject';

        var modelName = 'DocumentStatus';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.lookupStrKey = generator.getResultFromSelectedCollectionDocumentClass(model.lookupStrKey);
            delete model.documentClassesString;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            var documentClasses = lookupService.returnLookups(lookupService.documentClass);
            model.lookupStrKey = generator.getSelectedCollectionFromResultDocumentClass(documentClasses, model.lookupStrKey, 'lookupKey');
            model.documentClassesString = model.getDocumentClass();
            return model;
        });

    })
};
