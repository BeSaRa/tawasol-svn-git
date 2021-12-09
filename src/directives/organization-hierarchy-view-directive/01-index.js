module.exports = function (app) {
    require('./organization-hierarchy-view-directive')(app);
    require('./organizationHierarchyViewDirectiveCtrl')(app);
};