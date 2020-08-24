const path = require('path');
const webpack = require('webpack');
// const NGAnnotate = require('ng-annotate-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');
module.exports = function (env) {
    const cssResolver = isProduction(env) ? {
        loader: MiniCssExtractPlugin.loader, options: {
            publicPath: '../../'
        }
    } : {
        loader: 'style-loader',
        options: {sourceMap: !isProduction(env)}
    };

    const fileLoader = (isProduction(env) ? {
        loader: 'file-loader',
        options: {
            name: '[name].[ext]',
            publicPath: '../fonts/',
            outputPath: 'dist/fonts'
        }
    } : {
        loader: 'file-loader',
        options: {
            name: 'dist/fonts/[name].[ext]',
            useRelativePath: false
        }
    });
    var toFolder = './build';
    const copyFiles = [
        {from: './index.html', to: toFolder},
        {from: './views', to: toFolder + '/views'},
        {from: './dist', to: toFolder + '/dist'},
        {from: './assets', to: toFolder + '/assets'},
        {from: './guides', to: toFolder + '/guides'},
        {from: './help', to: toFolder + '/help'},
        {from: './node_modules/pspdfkit/dist/pspdfkit-lib', to: toFolder + '/pspdfkit/pspdfkit-lib'},
    ];

    const copyDevFiles = [
        {from: './node_modules/pspdfkit/dist/pspdfkit-lib', to: './pspdfkit/pspdfkit-lib'},
    ];


    return {
        mode: isProduction(env) ? env.mode : 'development',
        entry: './src/app.js',
        output: {
            path: path.resolve(__dirname),
            publicPath: '',
            filename: 'dist/js/bundle.js'
        },
        devtool: !isProduction(env) ? 'eval' : false,
        devServer: {
            hot: true,
            open: true,
            stats: "errors-only"
        },
        module: {
            rules: [
                {
                    test: /\.m?js$/,
                    exclude: /(node_modules|bower_components)/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env'],
                            plugins: ['angularjs-annotate']
                        }
                    }
                },
                // load html as text by raw loader
                {test: /\.html$/i, use: 'raw-loader'},
                {
                    test: /\.(css|scss)$/,
                    use: [
                        cssResolver,
                        {loader: 'css-loader', options: {sourceMap: !isProduction(env)}},
                        {loader: 'resolve-url-loader'},
                        {loader: 'sass-loader', options: {sourceMap: true}}
                    ]
                },
                {
                    test: /\.(ttf|eot|woff(2)?)(\?[a-z0-9=&.]+)?$/,
                    use: fileLoader
                },
                {
                    test: /\.(gif|svg|png|jpg)$/i,
                    use: {
                        loader: 'file-loader',
                        options: {
                            name: 'assets/images/[name].[ext]',
                            useRelativePath: false
                        }
                    }
                }
            ]
        },
        performance: {
            hints: false
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
            })/*,
            new NGAnnotate()*/
        ].concat((!isProduction(env) ? [new webpack.HotModuleReplacementPlugin(),
            new CopyPlugin({
                patterns: copyDevFiles
            })] : [
            new MiniCssExtractPlugin({
                filename: 'dist/css/style.css'
            }),
            new CopyPlugin({
                patterns: copyFiles
            })
        ]))
    };
};


function isProduction(env) {
    return env && env.mode === 'production'
}
