module.exports = function (app) {
    app.run(function (CMSModelInterceptor) {
        'ngInject';
        var modelName = 'DistributionWF';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.normalUsers = _.map(model.normalUsers, function (user) {
                return user.mapSend();
            });
            self.wfGroups = _.map(model.wfGroups, function (group) {
                return group.mapSend();
            });
            self.receivedOUs = _.map(model.receivedOUs, function (organization) {
                return organization.mapSend();
            });
            self.receivedRegOUs = _.map(model.receivedRegOUs, function (organization) {
                return organization.mapSend();
            });
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            return model;
        });

    })
};