module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      DocumentType,
                      lookupService,
                      generator) {
        'ngInject';

        var modelName = 'DocumentType';


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