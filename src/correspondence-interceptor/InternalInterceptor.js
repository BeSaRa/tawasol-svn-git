module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      _,
                      moment,
                      lookupService,
                      LinkedObject,
                      outgoingService,
                      documentTypeService,
                      documentTagService,
                      entityTypeService,
                      attachmentService,
                      documentCommentService,
                      $location,
                      generator) {
        'ngInject';
        var modelName = 'Internal';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            if (model.linkedAttachmenstList && model.linkedAttachmenstList.length) {
                model.linkedAttachmenstList = _.map(model.linkedAttachmenstList, function (item) {
                    delete item.createReplyDisableDelete;
                    return item;
                });
            }
            /*If Document has vsId(update document), we will not remove the content file.
            If document don't has vsId(new document), we will remove the content file, so it doesn't affect the save request model */
            if (!model.hasVsId() && model.contentFile)
                delete model.contentFile;

            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            if (!angular.isArray(model.tags))
                model.tags = (model.tags && model.tags.length) ? Array.prototype.slice.call(JSON.parse(model.tags)) : [];
            if (!angular.isArray(model.attachments))
                model.attachments = (model.attachments && model.attachments.length) ? Array.prototype.slice.call(JSON.parse(model.attachments)) : [];

            model.securityLevelLookup = lookupService.getLookupByLookupKey(lookupService.securityLevel, model.securityLevel);
            model.securityLevelIndicator = model.securityLevelLookup ? model.getSecurityLevelIndicator(model.securityLevelLookup) : null;

            model.priorityLevelLookup = lookupService.getLookupByLookupKey(lookupService.priorityLevel, model.priorityLevel);
            model.priorityLevelIndicator = (model.priorityLevelLookup && model.priorityLevelLookup.lookupKey !== 0) ? model.getPriorityLevelIndicator(model.priorityLevelLookup) : null;

            model.docClassIndicator = model.getDocClassIndicator();

            return model;
        });

    })
};
