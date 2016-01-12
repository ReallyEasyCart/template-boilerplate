
# REC Template Boilerplate (inc. Sass + auto FTP support)

Boilerplate for starting a new responsive template with REC. Some basic conventions and a simple folder structure to get started. With Sass files used to build the css, and a simple node script pre written for you to automatically ftp up your sass => css on changes. Use this with Atom's remote-sync and every change and compiled change will always be uploaded on save.

## What you get

- Sass support
- Auto FTP uploads on save of files and on compile of sass to css
- A simple default project folder structure.
- Sass helpers to target specific pages, and do other cool stuff, see: css/site/_mixins.scss
- Page.js installed to allow you to target specific page javascript easily, see: js/site/router.js.twig

## Get started:

1. Download and extract this folder as a [zip](https://github.com/ReallyEasyCart/template-boilerplate/archive/master.zip) or clone it down with git to begin.

2. Name the folder whatever your project will be :).

3. Open Atom and open the .remote-sync.json file, replacing HOST, USER and PASS with these details from the site.

4. Open the terminal and run `./sync.js --browsersync --sass` in this folder.  
    This will start watching the sass/scss files and on change auto compile them to css and then auto upload that css file.  
    The reason this is needed is that Atom's remote-sync (and other similar text editors) will upload the file you are changing but won't upload the compiled css file that came from sass. So this script takes care of that for you.  
    **You will need node and npm installed for this to work**  
    **Also you will need to run `npm install` in this directory the first time you get started to automatically install some dependencies we use to compile the sass to css and upload it with ftp.**

5. the above command also runs browser sync which live reloads the pages on changes and syncs multiple devices given a url
    You can run `./sync.js --help` for info on this command. As well as choosing to just run browsersync with `./sync.js --browsersync` if you don't want to use sass :). 

## Where to start coding

- With html files, throw them into the html/ directory as you would normally, use the same filename as in the responsive-base directory to override.
- With css & sass, put all your style into the scss files inside css/site/. Best to read through these files but here's a quick run down:
    - _base.scss for base styles of the site such as a base for all headings, buttons etc.
    - _mixins.scss for sass mixins/functions
    - _pages.scss for page specific styles, e.g. homepage only vs about-us page etc.
    - _variables.scss, you can use this file to setup vars to use to repeat through your code such as common colours used, image locations maybe too.
    - _vendor.scss is for importing 3rd party css files such as installed from bower etc.
    - layout/ for layout sections of your site, such as the header/middle/footer
    - modules/ for specific modules such as additions to the modal or nav.  
    The modules here wont override the modules files used in the responsive-base, instead they add to them. But if you'd like to override them still just create a modules folder above right in the css/ directory.
- With javascript you can put all your code into js/site/, i've put 3 default files in here for you to get started.
    - global.js.twig, for global javascript needed on all pages.
    - router.js.twig for javascript needed on specific pages such as just the homepage
    - vendor.js.twig for importing 3rd party javascript files such as page.js which we use to build the router file :)

All of this is just an example default layout, in no way should you be forced to work this way, and feel free to add and remove what you'd like.
