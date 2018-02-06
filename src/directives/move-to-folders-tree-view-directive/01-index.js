module.exports = function (app) {
    require('./move-to-folders-tree-view-directive')(app);
    require('./moveToFoldersTreeViewDirectiveCtrl')(app);
    require('./move-to-folders-tree-view-style.scss');
};