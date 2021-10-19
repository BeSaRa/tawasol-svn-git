module.exports = function (app) {
    app.run(function (CMSModelInterceptor, _, generator) {
        'ngInject';
        var modelName = 'UserFollowupBookMulti';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.followUpDate = generator.getTimeStampFromDate(model.followUpDate);
            if (model.userList.length) {
                model.userList = _.map(model.userList, function (item) {
                    return {first: item.id, second: item.ouId};
                })
            }
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            return model;
        });

    })
};
