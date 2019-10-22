module.exports = function (app) {
    app.run(function (CMSModelInterceptor, _) {
        'ngInject';

        var modelName = 'Broadcast';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.ouList = _.map(model.ouList, function (ou) {
                ou.itemId = ou.itemId && ou.itemId.hasOwnProperty('id') ? ou.itemId.id : ou.itemId;
                ou.rank = ou.rank && ou.rank.hasOwnProperty('lookupKey')? ou.rank.lookupKey : ou.rank;
                ou.jobTitle = ou.jobTitle && ou.jobTitle.hasOwnProperty('lookupKey')? ou.jobTitle.lookupKey : ou.jobTitle;
                return ou;
            });

            model.wfGroups = _.map(model.wfGroups, function (wfGroup) {
                wfGroup.itemId = wfGroup.itemId && wfGroup.itemId.hasOwnProperty('id') ? wfGroup.itemId.id : wfGroup.itemId;
                wfGroup.rank = wfGroup.rank && wfGroup.rank.hasOwnProperty('lookupKey')? wfGroup.rank.lookupKey : wfGroup.rank;
                wfGroup.jobTitle = wfGroup.jobTitle && wfGroup.jobTitle.hasOwnProperty('lookupKey')? wfGroup.jobTitle.lookupKey : wfGroup.jobTitle;
                return wfGroup;
            });

            model.action = model.action.id;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            return model;
        });

    })
};
