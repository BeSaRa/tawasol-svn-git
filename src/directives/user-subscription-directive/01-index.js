module.exports = function (app) {
    require('./user-subscription-directive')(app);
    require('./userSubscriptionDirectiveCtrl')(app);
};