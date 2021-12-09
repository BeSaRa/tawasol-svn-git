module.exports = function (app) {
    require('./roleFilter')(app);
    require('./permissionFilter')(app);
    require('./translatedNameFilter')(app);
};