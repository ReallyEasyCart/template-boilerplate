
'use strict';

const path = require('path');
const chokidar = require('chokidar');
const sass = require('node-sass');
const fs = require('fs');
const ftpClient = require('ftp');
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
        process.exit(1);
    }
}

ftpConfig = JSON.parse(ftpConfig);
if ( ! ftpConfig) {
    console.log('Remote-sync config file is not valid JSON');
    process.exit(1);
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
ftpConnection.on('close', () => {
    console.log('FTP connection closed');
});
ftpConnection.on('error', (err) => {
    console.log('FTP Error: ', err);
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

// cleanly close ftp on process exit (Ctrl+c)
let isClosing = false;
process.on('SIGINT', function() {
    ftpConnection.end();
    if (isClosing) { // on double Ctrl+c, really exit
        process.exit(1);
    }
    isClosing = true;
});
