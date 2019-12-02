module.exports = function (app) {
    app.run(function (CMSModelInterceptor, _) {
        'ngInject';
        var modelName = 'DistributionWF';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.normalUsers = _.map(model.normalUsers, function (user) {
                return user.mapSend();
            });
            model.wfGroups = _.map(model.wfGroups, function (group) {
                return group.mapSend();
            });
            model.receivedOUs = _.map(model.receivedOUs, function (organization) {
                return organization.mapSend();
            });
            model.receivedRegOUs = _.map(model.receivedRegOUs, function (organization) {
                return organization.mapSend(true);
            });
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            return model;
        });

    })
};
