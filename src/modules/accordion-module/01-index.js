module.exports = function (app) {
    require('./accordion-directive')(app);
    require('./accordionDirectiveCtrl')(app);
    require('./accordion-title')(app);
    require('./accordion-item')(app);
};