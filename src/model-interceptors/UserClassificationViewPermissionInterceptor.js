module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      generator, 
                      lookupService ,
                      classificationService) {
        'ngInject';
        var modelName = 'UserClassificationViewPermission';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.classificationId = model.classificationId.id;
            model.securityLevels = generator.getResultFromSelectedCollection(model.securityLevels,'lookupKey');
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            var securityLevels = lookupService.returnLookups(lookupService.securityLevel);
            model.securityLevels = generator.getSelectedCollectionFromResult(securityLevels,model.securityLevels, 'lookupKey');
            model.classificationId  =classificationService.getClassificationById(model.classificationId);
            return model;
        });

    })
};