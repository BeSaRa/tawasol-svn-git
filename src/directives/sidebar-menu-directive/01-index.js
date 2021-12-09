module.exports = function (app) {
    require('./sidebar-menu-directive')(app);
    require('./sidebarMenuDirectiveCtrl')(app);
    require('./has-child-class-directive')(app);
};