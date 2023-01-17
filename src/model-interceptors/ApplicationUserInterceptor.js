module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      jobTitleService,
                      generator,
                      lookupService,
                      Lookup,
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

            model.newItemSmspriority = (!model.newsmsEmailNotify) ? null : (model.newItemSmspriority instanceof Lookup) ? generator.getResultFromSelectedCollection(model.newItemSmspriority, 'lookupKey') : model.newItemSmspriority;
            model.deadlineSmspriority = (!model.deadlinesmsNotify) ? null : (model.deadlineSmspriority instanceof Lookup) ? generator.getResultFromSelectedCollection(model.deadlineSmspriority, 'lookupKey') : model.deadlineSmspriority;
            model.reminderSmsPriority = (!model.reminderSmsnotify) ? null : (model.reminderSmsPriority instanceof Lookup) ? generator.getResultFromSelectedCollection(model.reminderSmsPriority, 'lookupKey') : model.reminderSmsPriority;
            model.newItemEmailPriority = (!model.newItemEmailNotify) ? null : (model.newItemEmailPriority instanceof Lookup) ? generator.getResultFromSelectedCollection(model.newItemEmailPriority, 'lookupKey') : model.newItemEmailPriority;
            model.deadlineEmailPriority = (!model.deadlineEmailNotify) ? null : (model.deadlineEmailPriority instanceof Lookup) ? generator.getResultFromSelectedCollection(model.deadlineEmailPriority, 'lookupKey') : model.deadlineEmailPriority;
            model.reminderEmailPriority = (!model.reminderEmailNotify) ? null : (model.reminderEmailPriority instanceof Lookup) ? generator.getResultFromSelectedCollection(model.reminderEmailPriority, 'lookupKey') : model.reminderEmailPriority;

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
            model.newItemSmspriority = Array.isArray(model.newItemSmspriority) ? model.newItemSmspriority : generator.getSelectedCollectionFromResult(notificationPriorityLevel, model.newItemSmspriority, 'lookupKey');
            model.deadlineSmspriority = Array.isArray(model.deadlineSmspriority) ? model.deadlineSmspriority : generator.getSelectedCollectionFromResult(notificationPriorityLevel, model.deadlineSmspriority, 'lookupKey');
            model.reminderSmsPriority = Array.isArray(model.reminderSmsPriority) ? model.reminderSmsPriority : generator.getSelectedCollectionFromResult(notificationPriorityLevel, model.reminderSmsPriority, 'lookupKey');
            model.newItemEmailPriority = Array.isArray(model.newItemEmailPriority) ? model.newItemEmailPriority : generator.getSelectedCollectionFromResult(notificationPriorityLevel, model.newItemEmailPriority, 'lookupKey');
            model.deadlineEmailPriority = Array.isArray(model.deadlineEmailPriority) ? model.deadlineEmailPriority : generator.getSelectedCollectionFromResult(notificationPriorityLevel, model.deadlineEmailPriority, 'lookupKey');
            model.reminderEmailPriority = Array.isArray(model.reminderEmailPriority) ? model.reminderEmailPriority : generator.getSelectedCollectionFromResult(notificationPriorityLevel, model.reminderEmailPriority, 'lookupKey');

            model.mapReceived();
            return model;
        });

    });
};
