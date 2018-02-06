module.exports = function (app) {
    require('./grid-actions-directive')(app);
    require('./gridActionsDirectiveCtrl')(app);
};