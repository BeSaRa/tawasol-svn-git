module.exports = function (app) {
    require('./organization-without-reg-tree-view-directive')(app);
    require('./organizationWithoutRegTreeViewDirectiveCtrl')(app);
    require('./organization-without-reg-tree-view-style.scss');
};