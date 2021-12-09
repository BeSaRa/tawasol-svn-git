module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      lookupService,
                      _,
                      $location,
                      generator,
                      OUClassification,
                      ouClassificationService,
                      organizationService,
                      classificationService,
                      Classification) {
        'ngInject';

        var modelName = 'Classification';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.setOUClassificationService(ouClassificationService);
            model.setOrganizationService(organizationService);
            model.setClassificationService(classificationService);
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.securityLevels = generator.getResultFromSelectedCollection(model.securityLevels, 'lookupKey');
            model.parent = (model.parent instanceof Classification) ? model.parent.id : model.parent;
            model.relatedOus = model.isGlobal ? [] : model.relatedOus;
            model.itemOrder = (model.itemOrder === '' || typeof model.itemOrder === 'undefined') ? generator.createNewID(classificationService.classifications, 'itemOrder') : model.itemOrder;
            delete model.children;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            var securityLevels = lookupService.returnLookups(lookupService.securityLevel);
            var relatedOus = ouClassificationService.returnOUClassifications();

            model.securityLevels = generator.getSelectedCollectionFromResult(securityLevels, model.securityLevels, 'lookupKey');
            model.relatedOus = _.filter(relatedOus, function (OUClassification) {
                return OUClassification.classification.id === model.id;
            });
            model.parent = angular.copy(classificationService.getClassificationById(model.parent)) || model.parent;
            if (model.parent)
                delete model.parent.children;
            model.children = classificationService.getSubClassifications(model);
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            if ($location.path() === '/classifications') {
                if (model.relatedOus.length && model.isGlobal) {
                    model.isGlobal = false;
                }

                if (!model.isGlobal && !model.relatedOus.length) {
                    model.isGlobal;
                }
            }
            return model;
        })

    })
};