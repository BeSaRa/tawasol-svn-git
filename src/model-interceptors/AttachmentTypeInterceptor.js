module.exports = function (app) {
    app.run(function (CMSModelInterceptor, AttachmentType, lookupService, generator) {
        'ngInject';

        var modelName = 'AttachmentType';


        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.lookupStrKey = generator.getResultFromSelectedCollectionDocumentClass(model.lookupStrKey);
            delete model.documentClassesString;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            var documentClass = lookupService.returnLookups(lookupService.documentClass);
            model.lookupStrKey = generator.getSelectedCollectionFromResultDocumentClass(documentClass, model.lookupStrKey, 'lookupKey');
            model.documentClassesString = model.getDocumentClass();
            return model;
        });


    })
};
