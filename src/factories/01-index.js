module.exports = function (app) {
    require('./_')(app); // lodash
    require('./perfectScrollbar')(app);
    require('./FilterFactory')(app);
    require('./LangWatcher')(app);
    require('./ResizeSensor')(app);
    // it is node functions
    require('./util')(app);
    require('./errorCode')(app);
    require('./ResolveDefer')(app);
    require('./base64Factory')(app);
};