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
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            var documentClass = lookupService.returnLookups(lookupService.documentClass);
            model.lookupStrKey = generator.getSelectedCollectionFromResultDocumentClass(documentClass, model.lookupStrKey, 'lookupKey');
            return model;
        });

    })
};