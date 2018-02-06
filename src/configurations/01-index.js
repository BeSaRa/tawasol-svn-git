module.exports = function (app) {
    require('./default')(app);
    require('./resolver')(app);
    require('./permissions')(app);
    require('./gridActions')(app);
};