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
