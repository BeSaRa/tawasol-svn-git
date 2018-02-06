module.exports = function (app) {
    app.run(function (CMSModelInterceptor) {
        'ngInject';

        var modelName = 'Broadcast';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.ouList = _.map(model.ouList, function (ou) {
                return {
                    first: ou.id,
                    second: true
                };
            });

            model.wfGroups = _.map(model.wfGroups, function (wfGroup) {
                return wfGroup.id;
            });

            model.action = model.action.id;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            return model;
        });

    })
};