module.exports = function (app) {
    require('./remove-layout-element')(app);
    require('./layout-sortable')(app);
    require('./layout-draggable')(app);
    require('./layout-droppable')(app);
};