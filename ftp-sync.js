'use strict';

const chokidar = require('chokidar');
const sass = require('node-sass');
const fs = require('fs');
const ftpClient = require('ftp');
let ftpConnection = new ftpClient();

// sass compile to css function
function renderSassToCss() {
    // render the site.scss file
    sass.render({
        file: 'css/site.scss',
        outputStyle: 'expanded'
    }, (err, result) => {
        if (err) {
            console.log('SASS', err.formatted);
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
        }
    })
}

// await connection before watching / compiling any files
ftpConnection.on('ready', () => {

    // begin watching directories
    chokidar.watch('css/**/*.scss', {
        ignored: /[\/\\]\./,
        persistent: true,
        ignoreInitial: true // don't fire on existing files, only changes from now onwards
    }).on('all', (event, path) => {
        // console.log(event, path);
        renderSassToCss();
    });

    // initial sass compile (incase of changes before this was run)
    renderSassToCss();

    // let the user know it's all setup and ready
    console.log('Connected & watching for sass file changes to upload.');

});

// collect FTP details
let ftpConfig = fs.readFileSync('.remote-sync.json');
if ( ! ftpConfig) {
    console.log('Please setup remote-sync config file');
}
ftpConfig = JSON.parse(ftpConfig);
if ( ! ftpConfig) {
    console.log('Remote-sync config file is not valid JSON');
}

// connect to FTP
ftpConnection.connect({
    host: ftpConfig.hostname,
    user: ftpConfig.username,
    password: ftpConfig.password,
    port: ftpConfig.port || 21
});
console.log('Connecting to FTP account...');
