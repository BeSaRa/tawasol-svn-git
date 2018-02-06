module.exports = function (app) {
    require('./language-switcher-directive')(app);
    require('./languageSwitcherDirectiveCtrl')(app);
};