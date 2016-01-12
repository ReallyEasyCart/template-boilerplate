#!/usr/bin/env node
'use strict';

const path = require('path');
const chokidar = require('chokidar');
const fs = require('fs');
const ftpClient = require('ftp');
const sass = require('node-sass');
const browserSync = require('browser-sync').create();
let ftpConnection = new ftpClient();


// collect FTP details
let ftpConfig = null;
try {
    // try in current folder
    ftpConfig = fs.readFileSync('.remote-sync.json');
}
catch (e) {
    // else try in above folder
    try {
        ftpConfig = fs.readFileSync('../.remote-sync.json');
    }
    catch (e) {
        console.log('Please setup .remote-sync.json config file');
    }
}

ftpConfig = JSON.parse(ftpConfig);
if ( ! ftpConfig) {
    console.log('Remote-sync config file is not valid JSON');
}
// root target? (well we still just want to sync this folder, so take this folders name instead)
if (ftpConfig.target == '/') {
    ftpConfig.target = '/' + path.basename(__dirname);
}

// sass compile to css function
function renderSassToCss() {
    // render the site.scss file
    sass.render({
        file: 'css/site.scss',
        outputStyle: 'expanded'
    }, (err, result) => {
        if (err) {
            console.log('SASS', err.formatted);
            // read in the current file contents and add this error to the top
            let errorString = "/* !!! SASS ERROR !!! */ \n\
body:before { \n\
    content: \"SASS "+ err.formatted.replace(/"/g, '\\"').replace(/\n/g, '\\A') + "\"; \n\
    background: #FFF; color: #000; padding: 1em; font-size: 1.6em; \n\
    position: fixed; top: 0; left: 0; right: 0; z-index: 9999; \n\
    white-space: pre; font-family: monospace; \n\
} \n\
";
            fs.readFile('css/site-sass-out.css.twig', 'utf8', function (err,data) {
                if (err) {
                    console.log('Error appending sass error text to css file');
                } else {
                    writeCssToFile(data + errorString);
                }
            });
        } else {
            // No errors during the compilation, write this result on the disk
            // console.log(result.css.toString());
            writeCssToFile(result.css);
        }
    });
}

// write css file function
function writeCssToFile(css) {
    let outputFile = 'css/site-sass-out.css.twig';
    fs.writeFile(outputFile, css, (err) => {
        if (err) {
            console.log('File Saving Error:', err);
        } else {
            ftpUploadFile(outputFile);
        }
    });
}

// ftp upload file function
function ftpUploadFile(path) {
    ftpConnection.put(path, ftpConfig.target + '/' + path, (err) => {
        if (err) {
            console.log('FTP Error:', err);
        }
        else {
            console.log('=> Uploaded CSS File.');

            // reload in browsersync ;)
            if (browserSync) {
                browserSync.reload();
            }
        }
    })
}

// await connection before watching / compiling any files
let ftpConnected = false;
ftpConnection.on('ready', () => {

    // we're connected :D
    ftpConnected = true;

    // initial sass compile (incase of changes before this was run)
    renderSassToCss();

    // let the user know it's all setup and ready
    console.log('Connected & watching for sass file changes to upload.');

});
// ftpConnection.on('greeting', (msg) => {
//     console.log('FTP greeting: ', msg);
// });
ftpConnection.on('error', (err) => {
    console.log('FTP Error: ', err);
});
ftpConnection.on('close', () => {
    console.log('FTP connection closed');
    process.exit(1);
});
ftpConnection.on('end', () => {
    console.log('FTP connection ended');
    process.exit(1);
});

// begin watching directories
chokidar.watch('css/**/*.scss', {
    ignored: /[\/\\]\./,
    persistent: true,
    ignoreInitial: true // don't fire on existing files, only changes from now onwards
}).on('all', (event, path) => {
    // console.log(event, path);
    if (ftpConnected) {
        renderSassToCss();
    }
});

// connect to FTP
ftpConnection.connect({
    host: ftpConfig.hostname,
    user: ftpConfig.username,
    password: ftpConfig.password,
    port: ftpConfig.port || 21
});
console.log('Connecting to FTP account... Ctrl+c to close cleanly, and again to force exit.');

let browserSyncInstance = browserSync.init({
    proxy: "http://" + ftpConfig.hostname,
    tunnel: true,
    socket: {
        domain: browserSync.instance.utils.devIp[0] + ':3000' // get the host ip
    },
    open: false,
    logLevel: 'silent' // silent to stop browsersync saying where its live (as we're hacking to use http url instead of https)
});
// get the url, but force it to http instead of https
browserSyncInstance.events.on('service:running', function (bs) {
    let url = bs.urls.tunnel.replace('https://', 'http://');
    console.log('----------------------------------------------');
    console.log('BrowserSync live site: \x1b[35m%s\x1b[0m', url);
    console.log('BrowserSync admin UI:  \x1b[35m%s\x1b[0m', bs.urls.ui);
    console.log('----------------------------------------------');
});

// cleanly close ftp on process exit (Ctrl+c)
let isClosing = false;
process.on('SIGINT', function() {
    ftpConnection.end();
    if (isClosing) { // on double Ctrl+c, really exit
        process.exit(1);
    }
    isClosing = true;
});
