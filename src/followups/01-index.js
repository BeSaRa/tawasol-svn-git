module.exports = function (app) {
    require('./default')(app);
    require('./pagination')(app);
    require('./viewDocument')(app);
};