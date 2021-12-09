module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      _,
                      OUApplicationUser,
                      organizationService,
                      ApplicationUser) {
        'ngInject';

        var modelName = 'WorkflowGroup', naValue = 'N/A';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            if (!model.global) {
                model.arName = model.arName ? model.arName : naValue;
                model.enName = model.enName ? model.enName : naValue;
            }
            model.groupMembers = _.map(model.groupMembers, function (item) {
                return {
                    member: {id: item.applicationUser.id},
                    memberOuId: item.ouid.id
                }
            });
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            if (!model.global) {
                model.arName = (model.arName === naValue) ? null : model.arName;
                model.enName = (model.enName === naValue) ? null : model.enName;
            }
            var organizations = organizationService.returnOrganizations();

            model.groupMembers = _.map(model.groupMembers, function (item) {
                item.applicationUser = new ApplicationUser(item.member);
                item.ouid = _.find(organizations, function (organization) {
                    return organization.id === item.memberOuId;
                });
                return item;
            });
            return model;
        });

    })
};