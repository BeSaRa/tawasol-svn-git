module.exports = function (app) {
    app.run(function (CMSModelInterceptor) {
        'ngInject';
        var modelName = 'UserSearchCriteria';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            if (model.ou && model.ou.hasOwnProperty('id')) {
                model.ou = model.ou.id;
            } else if (model.ou && model.ou.hasOwnProperty('toOUId')) {
                model.ou = model.ou.toOUId;
            } else if (model.regOu && model.regOu.hasOwnProperty('id')) {
                model.regOu = model.regOu.id;
            } else if (model.regOu && model.regOu.hasOwnProperty('toOUId')) {
                model.regOu = model.regOu.toOUId;
            }

            model.ou = typeof model.ou === 'string' ? Number(model.ou.substr(1)) : model.ou;
            model.regOu = typeof model.regOu === 'string' ? Number(model.regOu.substr(1)) : model.regOu;

            // to hide organizations dropdown and add whole organization button in launch popup
            delete model.hide;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            return model;
        });

    })
};
