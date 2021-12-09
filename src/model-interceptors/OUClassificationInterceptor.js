module.exports = function (app) {
    app.run(function (CMSModelInterceptor, 
                      _, 
                      ouClassificationService, 
                      lookupService, 
                      organizationService, 
                      $location, 
                      Classification, 
                      generator) {
        'ngInject';

        var modelName = 'OUClassification';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.setOUClassificationService(ouClassificationService);
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.ouid = model.ouid.hasOwnProperty('id') ? model.ouid.id : model.ouid;
            model.classification.securityLevels = generator.getResultFromSelectedCollection(model.classification.securityLevels, 'lookupKey');
            model.classification.relatedOus = null;

            if (model.classification.parent)
                model.classification.parent = model.classification.parent.hasOwnProperty('id') ? model.classification.parent.id : model.classification.parent;

            delete model.classification.children;

            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.classification = generator.interceptReceivedInstance('Classification', new Classification(model.classification));

            model.ouid = _.find(organizationService.organizations, function (organization) {
                return organization.id === model.ouid;
            });
            return model;
        });

    });
};