module.exports = function (app) {
    // style
    require('./layout-style/layout-style.scss');
    require('./services/01-index')(app);
    require('./widgets/01-index')(app);
    require('./models/01-index')(app);
    require('./controllers/01-index')(app);
    require('./layouts-elements/01-index')(app);
    require('./model-interceptors/01-index')(app);
    require('./directives/01-index')(app);
};