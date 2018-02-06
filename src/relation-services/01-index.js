module.exports = function (app) {
    require('./ouClassificationService')(app);
    require('./ouDistributionListService')(app);
    require('./ouCorrespondenceSiteService')(app);
    require('./userWorkflowActionService')(app);
    require('./ouApplicationUserService')(app);
    require('./userWorkflowGroupService')(app);
    require('./ouDocumentFileService')(app);
};