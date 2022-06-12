module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      jobTitleService,
                      generator,
                      lookupService,
                      organizationService) {
        'ngInject';

        var modelName = 'ApplicationUser';


        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.setOrganizationService(organizationService);
            model.signature = [];
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.loginName = model.domainName;
            if (!generator.validRequired(model.seqWFEmailSettings) || !model.seqWFEmailSettings.length) {
                model.seqWFEmailSettings = 0;
            } else {
                model.seqWFEmailSettings = generator.getResultFromSelectedCollection(model.seqWFEmailSettings, 'lookupKey')
            }

            model.newItemSmspriority = (!model.newsmsEmailNotify) ? null : generator.getResultFromSelectedCollection(model.newItemSmspriority, 'lookupKey');
            model.deadlineSmspriority = (!model.deadlinesmsNotify) ? null : generator.getResultFromSelectedCollection(model.deadlineSmspriority, 'lookupKey');
            model.reminderSmsPriority = (!model.reminderSmsnotify) ? null : generator.getResultFromSelectedCollection(model.reminderSmsPriority, 'lookupKey');
            model.newItemEmailPriority = (!model.newItemEmailNotify) ? null : generator.getResultFromSelectedCollection(model.newItemEmailPriority, 'lookupKey');
            model.deadlineEmailPriority = (!model.deadlineEmailNotify) ? null : generator.getResultFromSelectedCollection(model.deadlineEmailPriority, 'lookupKey');
            model.reminderEmailPriority = (!model.reminderEmailNotify) ? null : generator.getResultFromSelectedCollection(model.reminderEmailPriority, 'lookupKey');

            if (model.signature) {
                delete model.signature;
            }
            model.mapSend();
            delete model.permissions;
            delete model.ouList;
            delete model.organization;
            delete model.signature;
            delete model.userOrganization;
            delete model.certificate;

            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            if (!generator.validRequired(model.seqWFEmailSettings) || model.seqWFEmailSettings === 0) {
                model.seqWFEmailSettings = [];
            } else {
                var seqWFEmailSettingsList = lookupService.returnLookups(lookupService.seqWFEmailSettings);
                model.seqWFEmailSettings = generator.getSelectedCollectionFromResult(seqWFEmailSettingsList, model.seqWFEmailSettings, 'lookupKey');
            }

            var notificationPriorityLevel = lookupService.returnLookups(lookupService.notificationPriorityLevel);
            model.newItemSmspriority = generator.getSelectedCollectionFromResult(notificationPriorityLevel, model.newItemSmspriority, 'lookupKey');
            model.deadlineSmspriority = generator.getSelectedCollectionFromResult(notificationPriorityLevel, model.deadlineSmspriority, 'lookupKey');
            model.reminderSmsPriority = generator.getSelectedCollectionFromResult(notificationPriorityLevel, model.reminderSmsPriority, 'lookupKey');
            model.newItemEmailPriority = generator.getSelectedCollectionFromResult(notificationPriorityLevel, model.newItemEmailPriority, 'lookupKey');
            model.deadlineEmailPriority = generator.getSelectedCollectionFromResult(notificationPriorityLevel, model.deadlineEmailPriority, 'lookupKey');
            model.reminderEmailPriority = generator.getSelectedCollectionFromResult(notificationPriorityLevel, model.reminderEmailPriority, 'lookupKey');

            model.mapReceived();
            return model;
        });

    });
};
