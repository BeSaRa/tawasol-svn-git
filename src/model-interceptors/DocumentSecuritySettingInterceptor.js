module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      generator,
                      lookupService) {
        'ngInject';
        var modelName = 'DocumentSecuritySetting';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.securityLevel = generator.getResultFromSelectedCollection(model.securityLevel, 'lookupKey');
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            var securityLevels = lookupService.returnLookups(lookupService.securityLevel);
            model.securityLevel = generator.getSelectedCollectionFromResult(securityLevels, model.securityLevel, 'lookupKey');
            return model;
        });

    })
};