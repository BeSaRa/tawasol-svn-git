module.exports = function (app) {
    require('./grid-context-menu-directive')(app);
    require('./gridContextMenuDirectiveCtrl')(app);
    require('./gridContextMenuPanelCtrl')(app);
};
