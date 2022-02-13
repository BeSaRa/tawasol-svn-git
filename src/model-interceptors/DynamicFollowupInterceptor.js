module.exports = function (app) {
    app.run(function (CMSModelInterceptor, generator, _, OUViewPermission, dynamicFollowupService, Information, lookupService) {
        'ngInject';

        var modelName = 'DynamicFollowup';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.setDynamicFollowupService(dynamicFollowupService);
            model.selectedReceivedDateFilterType = null;

            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.prepareSendDynamicFollowup();

            model.securityLevel = model.securityLevel ? generator.getResultFromSelectedCollection(model.securityLevel, 'lookupKey') : null;
            if (model.participantSet.length) {
                model.participantSet = _.map(model.participantSet, participant => {
                    return {
                        'id': (participant.id ? participant.id : null),
                        'userId': participant.userId,
                        'ouId': participant.ouId
                    }
                });
            }

            delete model.selectedReceivedDateFilterType;
            delete model.creatorInfo;

            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.prepareReceivedDynamicFollowup();

            var securityLevels = lookupService.returnLookups(lookupService.securityLevel);
            model.securityLevel = generator.getSelectedCollectionFromResult(securityLevels, model.securityLevel, 'lookupKey');

            model.participantSet = _.map(model.participantSet, function (user) {
                user.userInfo = generator.generateInstance(user.userInfo, Information);
                return user
            })
            return model;
        });
    })
};
