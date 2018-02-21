module.exports = function (app) {
    app.run(function (CMSModelInterceptor) {
        'ngInject';
        var modelName = 'UserSearchCriteria';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            if (model.ou.hasOwnProperty('id')) {
                model.ou = model.ou.id;
            } else if (model.ou.hasOwnProperty('toOUId')) {
                model.ou = model.ou.toOUId;
            }
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            return model;
        });

    })
};