module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      generator,
                      Attachment,
                      Outgoing,
                      Incoming,
                      Internal,
                      Site,
                      _,
                      lookupService) {
        'ngInject';

        var modelName = 'CreateReply',
            models = {
                outgoing: Outgoing,
                internal: Internal,
                incoming: Incoming
            },
            docClassName,
            followupStatusConfiguration,
            isNeedReplyFromConfiguration,
            followupStatuses,
            followupStatusWithoutReply,
            followupStatusNeedReply,
            // timestamp is used because SiteInterceptor is setting followupDate from timestamp
            defaultNeedReplyFollowupDate = _createCurrentDate(3).valueOf();

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            if (model.sitesToList && model.sitesToList.length) {
                docClassName = model.getInfo().documentClass.toLowerCase();
                followupStatusConfiguration = lookupService.getPropertyConfigurationBySymbolicName(docClassName, 'FollowupStatus');
                isNeedReplyFromConfiguration = followupStatusConfiguration ? followupStatusConfiguration.isMandatory : false;
                followupStatuses = lookupService.returnLookups(lookupService.followupStatus);
                followupStatusWithoutReply = _.find(followupStatuses, function (status) {
                    return status.lookupStrKey === 'WITHOUT_REPLY';
                });
                followupStatusNeedReply = _.find(followupStatuses, function (status) {
                    return status.lookupStrKey === 'NEED_REPLY';
                });

                model.sitesToList = generator.generateCollection(model.sitesToList, Site);
                model.sitesToList = generator.interceptReceivedCollection('Site', _.map(model.sitesToList, function (item) {
                    item.docClassName = model.getInfo().documentClass.toLowerCase();
                    if (isNeedReplyFromConfiguration) {
                        item.followupStatus = followupStatusNeedReply;
                        item.followupDate = defaultNeedReplyFollowupDate;
                    } else {
                        item.followupStatus = followupStatusWithoutReply;
                        item.followupDate = null;
                    }
                    return item;
                }));
            }

            if (model.linkedAttachmenstList && model.linkedAttachmenstList.length) {
                model.linkedAttachmenstList = generator.generateCollection(model.linkedAttachmenstList, Attachment);
                model.linkedAttachmenstList = generator.interceptReceivedCollection('Attachment', model.linkedAttachmenstList);
            }

            if (model.linkedDocList && model.linkedDocList.length) {
                var documentClass = model.linkedDocList[0].classDescription;
                if (model.docClassName !== "Internal") {
                    model.linkedDocList[0].siteInfo = angular.copy(model.sitesToList);
                }
                model.linkedDocList = generator.generateCollection(model.linkedDocList, _getModel(documentClass));
                model.linkedDocList = generator.interceptReceivedCollection(['Correspondence', _getModelName(documentClass)], model.linkedDocList);
            }
            return model;
        });

        /**
         * @description to specifying the model Name from given document class.
         * @param documentClass
         * @return {string}
         * @private
         */
        function _getModelName(documentClass) {
            documentClass = documentClass.toLowerCase();
            return documentClass.charAt(0).toUpperCase() + documentClass.substr(1);
        }


        function _getModel(documentClass) {
            return models[documentClass.toLowerCase()];
        }

        function _prepareSites(item) {
            item.docClassName = 'outgoing';
            return new Site(item);
        }

        function _createCurrentDate(days) {
            var date = new Date();
            date.setDate(date.getDate() + (days || 0));
            return date;
        }
    })
};
