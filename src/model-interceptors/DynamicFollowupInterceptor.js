module.exports = function (app) {
    app.run(function (CMSModelInterceptor, generator, _, OUViewPermission, dynamicFollowupService, Information) {
        'ngInject';

        var modelName = 'DynamicFollowup';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.setDynamicFollowupService(dynamicFollowupService);
            model.selectedReceivedDateFilterType = null;

            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.prepareSendDynamicFollowup();

            if (model.participantSet.length) {
                model.participantSet = _.map(model.participantSet, participant => {
                    return {'userId': participant.userId, 'ouId': participant.ouId}
                });
            }

            delete model.selectedReceivedDateFilterType;
            delete model.creatorInfo;
            console.log(model);
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.prepareReceivedDynamicFollowup();

            model.participantSet = _.map(model.participantSet, function (user) {
                user.userInfo = generator.generateInstance(user.userInfo, Information);
                return user
            })
            return model;
        });
    })
};
