module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      generator,
                      Classification,
                      lookupService,
                      Information) {
        'ngInject';

        var modelName = 'PrivateUserClassification';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.viewSecurityLevels = generator.filterSecurityLevels(model.viewSecurityLevels);
            model.viewSecurityLevels = generator.getResultFromSelectedCollection(model.viewSecurityLevels, 'lookupKey');

            model.archiveSecurityLevels = generator.filterSecurityLevels(model.archiveSecurityLevels);
            model.archiveSecurityLevels = generator.getResultFromSelectedCollection(model.archiveSecurityLevels, 'lookupKey');
            model.classification = {"id": model.classification.id, "groupPrefix": model.classification.groupPrefix};

            delete model.userInfo;
            delete model.ouInfo;
            delete model.viewSecurityLevelsString;
            delete model.archiveSecurityLevelsString;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.classification = generator.interceptReceivedInstance('Classification', generator.generateInstance(model.classification, Classification));
            model.ouInfo = new Information(model.actionByInfo);
            model.userInfo = new Information(model.userInfo);

            var securityLevels = lookupService.returnLookups(lookupService.securityLevel);

            if (typeof model.viewSecurityLevels !== "object") {
                model.viewSecurityLevels = generator.getSelectedCollectionFromResult(securityLevels, model.viewSecurityLevels, 'lookupKey');
                model.viewSecurityLevels = generator.filterSecurityLevels(model.viewSecurityLevels);
                model.viewSecurityLevelsString = model.getSecurityLevelsText(model.viewSecurityLevels);
            }

            if (typeof model.archiveSecurityLevels !== "object") {
                model.archiveSecurityLevels = generator.getSelectedCollectionFromResult(securityLevels, model.archiveSecurityLevels, 'lookupKey');
                model.archiveSecurityLevels = generator.filterSecurityLevels(model.archiveSecurityLevels);
                model.archiveSecurityLevelsString = model.getSecurityLevelsText(model.archiveSecurityLevels);
            }

            return model;
        });
    })
};
