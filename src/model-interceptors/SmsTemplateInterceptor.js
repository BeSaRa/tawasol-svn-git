module.exports = function (app) {
    app.run(function (CMSModelInterceptor, 
                      applicationUserService) {
        'ngInject';

        var modelName = 'SmsTemplate';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            if (model.isGlobal) {
                model.smstemplateSubscribers = [];
            }
            else {
                if (model.smstemplateSubscribers) {
                    model.smstemplateSubscribers = _.map(model.smstemplateSubscribers, function (smsTemplateSubscriber) {
                        return {"applicationUserId": smsTemplateSubscriber.id};
                    });
                }
            }
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            var smsTemplateSubscribersIds = _.map(model.smstemplateSubscribers, "applicationUserId");
            applicationUserService
                .getApplicationUsers()
                .then(function (applicationUsers) {
                    model.smstemplateSubscribers = _.filter(applicationUsers, function (applicationUser) {
                        return (smsTemplateSubscribersIds.indexOf(applicationUser.id) > -1);
                    });
                });
            return model;
        });

    })
};