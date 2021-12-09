module.exports = function (app) {
    require('./langService')(app);
    require('./lang-directive')(app);
    require('./lang-filter')(app);
    require('./lang-key-exists-directive')(app);
};