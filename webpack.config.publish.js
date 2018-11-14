var path = require('path'),
    webpack = require('webpack'),
    NGAnnotate = require('ng-annotate-webpack-plugin'),
    ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
    context: path.resolve(__dirname),
    entry: './src/app.js',
    devtool: false,
    output: {
        path: path.resolve(__dirname),
        filename: '/dist/js/bundle.js',
        publicPath: ''
    },
    devServer: {
        hot: true,
        inline: true,
        stats: "errors-only",
        open: true
    },
    module: {
        loaders: [
            {
                test: /\.html$/,
                use: [
                    {loader: 'raw-loader'}
                ]
            },
            {
                test: /\.(css|scss)$/,
                use: ExtractTextPlugin.extract(
                    {
                        fallback: 'style-loader',
                        use: [
                            // {loader: 'style-loader', options: {sourceMap: true}},
                            {loader: 'css-loader', options: {sourceMap: true}},
                            {loader: 'resolve-url-loader', options: {sourceMap: true}},
                            {loader: 'sass-loader', options: {sourceMap: true}}
                        ]
                    }
                )
            },
            {
                test: /\.(ttf|eot|woff(2)?)(\?[a-z0-9=&.]+)?$/,
                use : {
                    loader: 'file-loader',
                    options: {
                        name: '../../dist/fonts/[name].[ext]',
                        useRelativePath: false
                    }
                }

            },
            {
                test: /\.(gif|svg|png|jpg)$/i,
                use: {
                    loader: 'file-loader',
                    options: {
                        name: '../../assets/images/[name].[ext]',
                        useRelativePath: false
                    }
                }
            }
        ]
    },
    plugins: [
        new webpack.ProvidePlugin({
            jQuery: 'jquery',
            $: 'jquery',
            'window.jQuery': 'jquery',
            html2canvas: 'html2canvas',
            jsPDF: 'jspdf',
            tinycolor: 'tinycolor2',
            CountUp: 'countup.js'
        }),
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify('production')
            }
        }),
        new ExtractTextPlugin('dist/css/style.css'),
        new NGAnnotate(),
        new webpack.optimize.AggressiveMergingPlugin(),
        new webpack.optimize.UglifyJsPlugin({
            mangle: true,
            compress: {
                warnings: false, // Suppress uglification warnings
                pure_getters: true,
                unsafe: true,
                unsafe_comps: true,
                screw_ie8: true
            },
            output: {
                comments: false
            },
            exclude: [/\.min\.js$/gi] // skip pre-minified libs
        })
    ]
};