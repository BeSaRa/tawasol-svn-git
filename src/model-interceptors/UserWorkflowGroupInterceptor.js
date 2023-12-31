module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      ApplicationUser,
                      generator,
                      WorkflowGroup,
                      _,
                      organizationService) {
        'ngInject';

        var modelName = 'UserWorkflowGroup';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.wfgroup = generator.interceptReceivedInstance('WorkflowGroup', generator.generateInstance(model.wfgroup, WorkflowGroup));
            model.applicationUser = generator.interceptReceivedInstance('ApplicationUser',generator.generateInstance(model.applicationUser, ApplicationUser));
            organizationService.getOrganizations().then(function (organizations) {
                _.map(model.wfgroup.groupMembers, function (member, key) {
                    model.wfgroup.groupMembers[key].applicationUser = new ApplicationUser(member.member);
                    model.wfgroup.groupMembers[key].ouid = _.find(organizations, function (organization) {
                        return organization.id === model.wfgroup.groupMembers[key].memberOuId;
                    });
                });
            });
            return model;
        });

    })
};