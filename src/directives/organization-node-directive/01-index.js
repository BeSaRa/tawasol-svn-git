module.exports = function (app) {
    require('./organization-node-directive')(app);
    require('./organizationNodeDirectiveCtrl')(app);
};