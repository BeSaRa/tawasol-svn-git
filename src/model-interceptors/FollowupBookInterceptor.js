module.exports = function (app) {
    app.run(function (CMSModelInterceptor, generator, lookupService, correspondenceService, managerService ,Information, followUpUserService, _) {
        'ngInject';
        var modelName = 'FollowupBook';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model
                .setFollowUpUserService(followUpUserService)
                .setManagerService(managerService)
                .setCorrespondenceService(correspondenceService);
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            delete model.docClassIndicator;
            delete model.docDateString;
            delete model.actionDateString;
            delete model.followupDateString;
            delete model.followDateIndicator;
            delete model.siteFollowUpDueDateIndicator;
            delete model.numberOfDays;
            delete model.securityLevelLookup;
            delete model.securityLevelIndicator;
            delete model.priorityLevelLookup;
            delete model.priorityLevelIndicator;
            delete model.folderInfo;
            delete model.mainSiteSubSiteString;   // added in model when binding main-site-sub-site directive value in grid
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.docClassIndicator = model.getDocClassIndicator(generator.getDocumentClassName(model.docClassId));
            model.docDateString = generator.getDateFromTimeStamp(model.docDate);
            model.actionDateString = generator.getDateFromTimeStamp(model.actionDate);
            model.followupDateString = generator.getDateFromTimeStamp(model.followupDate);
            model.followDateIndicator = model.getFollowupDateIndicator(model.followupDate);
            model.siteFollowUpDueDateIndicator = model.getSiteFollowupDueDateIndicator(); // this indicator is used to show followup date of book. its not showing info for correspondence site followup date
            var numberOfDays = generator.getNumberOfDays(model.followupDate, new Date(), true);
            // -(numberOfDays) means, get positive number if date is in future
            model.numberOfDays = numberOfDays === 0 ? numberOfDays : -(numberOfDays);
            model.securityLevelLookup = lookupService.getLookupByLookupKey(lookupService.securityLevel, model.securityLevel);
            model.securityLevelIndicator = model.securityLevelLookup ? model.getSecurityLevelIndicator(model.securityLevelLookup) : null;
            model.priorityLevelLookup = lookupService.getLookupByLookupKey(lookupService.priorityLevel, model.priorityLevel);
            model.priorityLevelIndicator = (model.priorityLevelLookup && model.priorityLevelLookup.lookupKey !== 0) ? model.getPriorityLevelIndicator(model.priorityLevelLookup) : null;
            var folder = followUpUserService.getFollowupFoldersById(model.folderId);
            model.folderInfo = !folder ? new Information() : new Information({
                arName: folder.getNameByLanguage('ar'),
                enName: folder.getNameByLanguage('en'),
                id: folder.id,
                parent: folder.parent
            });
            model.setMainSiteSubSiteString();

            return model;
        });

    })
};
