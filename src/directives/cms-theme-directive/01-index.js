module.exports = function (app) {
    require('./cms-theme-directive')(app);
    require('./cmsThemeDirectiveCtrl')(app);
};