const chalk = require('chalk');
const glob = require('glob');
const closureCompiler = require('google-closure-compiler-js');
const compress = require('./compress').compress;
const fs = require('fs-promise');
const archiver = require('archiver');
const p = require('path');
const projectSettings = require('./projectSettings');
const shaderGen = require('./shadergen');
const utils = require('./utils');
const dasbootGen = require('./dasbootgen');
const fontGen = require('./fontgen');
const walk = require('walk');
const slugify = require('slugify');


function moveCursorToColumn(col) {
  return '\x1B[' + col + 'G';
}

function renderOK() {
  console.log(moveCursorToColumn(72) +
    chalk.grey('[') + chalk.green('✔️ OK') + chalk.grey(']'));
}

function renderWarn() {
  console.log(moveCursorToColumn(70) +
    chalk.grey('[') + chalk.yellow('⚠️ WARN') + chalk.grey(']'));
}

function renderError() {
  console.log(moveCursorToColumn(69) +
    chalk.grey('[') + chalk.red('❌ ERROR') + chalk.grey(']'));
}

function slugifyTitle(title) {
  return slugify(title).toLowerCase();
}

async function createArchive(projectPath) {
  return new Promise(resolve => {
    process.stdout.write(chalk.yellow('\nCreating zip archive'));
    const metadata = utils.getProjectMetadata(projectPath);
    const slug = slugifyTitle(metadata.projectSettings.title);
    const outputStream = fs.createWriteStream(p.join('bin', slug + '.zip'));
    const archive = archiver('zip');
    archive.pipe(outputStream);
    let foundErrors = false;
    archive.on('warning', e => {
      process.stdout.write(
        chalk.white((foundErrors ? '- ' : '\n- ') + e.message));
      renderWarn();
      foundErrors = true;
    });
    archive.on('error', e => {
      process.stdout.write(
        chalk.white((foundErrors ? '- ' : '\n- ') + e.message));
      renderError();
      foundErrors = true;
    });
    archive.file('screenshot.png');
    archive.file(slug + '.nfo');
    archive.file(p.join('bin', slug + '.png.html'), {
      name: slug + '.png.html',
    });
    archive.on('finish', () => {
      if(!foundErrors) {
        renderOK();
      }
      resolve();
    });
    archive.finalize();
  });
}

async function res(projectPath) {
  const walker = walk.walk(projectPath + '/res/' , {followLinks: false});
  const files = [];
  console.log(chalk.yellow('\nCollecting files from res/'));
  walker.on('file', async function(root, stat, next) {

    /* hacks to ensure slashes in path are correct.
     * TODO: is there a bug in walker that causes
     * these things to happen?  */
    root += '/';
    root = root.replace(/\/\//g, '/');

    const filename = root + stat.name;
    const file = await fs.readFile(filename);
    if(p.extname(filename) == '.woff2') {
      process.stdout.write('- Skipping ' + chalk.grey(root.slice(projectPath.length + 1)) + chalk.magenta(stat.name) + chalk.grey(', (it is a font)'));
      renderOK();
      next();
      return;
    }
    process.stdout.write('- Assimilating ' + chalk.grey(root.slice(projectPath.length + 1)) + chalk.magenta(stat.name));

    files.push('FILES[\'' + root.slice(projectPath.length + 1) + stat.name + '\']=\'' +
      file.toString('base64') + '\'');
    renderOK();
    next();
  });
  return new Promise(resolve => {
    walker.on('end', function(){
      process.stdout.write(chalk.yellow('\nMerging assimilated files'));
      resolve('FILES={};' + files.join(';') + ';');
      renderOK();
    });
  });
}

async function collect(projectPath, data) {
  const projectMetadata = utils.getProjectMetadata(projectPath);
  const slug = slugifyTitle(projectMetadata.projectSettings.title);
  process.stdout.write(chalk.yellow('\nGenerating ' + slug + '.html'));
  const {
    projectSettings,
    projectVersion,
    projectOrigin,
  } = projectMetadata;

  const ninMeta = utils.getNinMetadata();

  const metadata = {
    'Title': projectSettings.title,
    'Author': projectSettings.authors.join(', '),
    'Description': projectSettings.description,
    'Creation time': '' + new Date(),
    'Software': `${projectVersion} @ ${projectOrigin}\n${ninMeta.name}@${ninMeta.version} from ${ninMeta.origin}`,
    previewImage: projectSettings.previewImage
  };

  const metadataAsHTMLComments = Object.keys(metadata)
    .map(key => `<!-- ${key}: ${metadata[key]} -->`)
    .join('\n');

  const escapedTitle = utils.unsafeHTMLEscape(metadata.Title);
  const ogTags =
    `<meta property="og:title" content="${escapedTitle}" />
    <meta property="og:description" content="${utils.unsafeHTMLEscape(metadata.Description)}" />
    <meta property="og:image" content="${metadata.previewImage}" />
    <meta name="author" content="${utils.unsafeHTMLEscape(metadata.Author)}" />
    <title>${escapedTitle}</title>`;

  const htmlPreamble =
    fs.readFileSync(projectPath + '/index.html', {encoding: 'utf8'})
    .replace(
      'NIN_WILL_REPLACE_THIS_TAG_WITH_YOUR_ANALYTICS_ID',
      projectSettings.googleAnalyticsID)
    .replace(
      'NIN_WILL_REPLACE_THIS_TAG_WITH_AUTOGENERATED_COMMENT_TAGS',
      metadataAsHTMLComments)
    .replace(
      'NIN_WILL_REPLACE_THIS_TAG_WITH_AUTOGENERATED_META_TAGS',
      ogTags);

  const html =
    htmlPreamble +
    '<script>' +
    'GU=1;' + /* hack to make sure GU exisits from the get-go */
    'BEAN=0;' +
    'BEAT=false;' +
    data +
    'var graph = JSON.parse(atob(FILES["res/graph.json"]));' +
    'demo=bootstrap({graph:graph, onprogress: ONPROGRESS, oncomplete: ONCOMPLETE});' +
    '</script>';
  await fs.outputFile(p.join(projectPath, 'bin', slug + '.html'), html);
  renderOK();

  process.stdout.write(chalk.yellow('\nCompressing demo to .png.html'));
  const compressed = await compress(projectPath, data, htmlPreamble, metadata);
  await fs.outputFile(p.join(projectPath, 'bin', slug + '.png.html'), compressed);
  renderOK();
}

const compile = async function(projectPath, options) {
  const genPath = p.join(projectPath, '/gen/');
  await fs.remove(genPath);

  const data = await res(projectPath);
  await fs.outputFile(p.join(genPath, 'files.js'), data);

  projectSettings.generate(projectPath);

  await Promise.all([
    shaderGen(projectPath, options.optimizeShaders),
    fontGen(projectPath),
    dasbootGen(projectPath),
  ]);

  const globPaths = [
    projectPath + '/gen/*.js ',
    projectPath + '/lib/*.js ',
    projectPath + '/src/*.js',
  ];
  const jsCode = [].concat.apply(
    [], globPaths.map(globPath => glob.sync(globPath)))
    .map(path => ({
      src: fs.readFileSync(path, 'utf8'),
      path
    }));
  if (!options.closureCompiler) {
    process.stdout.write(chalk.yellow('\nConcatenating source files'));
    const sources = jsCode.map(file => file.src).join(';');
    renderOK();
    await collect(projectPath, sources);
  } else {
    process.stdout.write(chalk.yellow('\nRunning closure compiler'));
    const out = closureCompiler.compile({jsCode});
    if(out.errors.length) {
      renderError();
      out.errors.map(console.error);
      process.exit(1);
    } else if(out.warnings.length) {
      renderWarn();
      out.warnings.map(console.error);
    } else {
      renderOK();
    }
    await collect(projectPath, out.compiledCode);
  }

  await createArchive(projectPath);
  const projectMetadata = utils.getProjectMetadata(projectPath);
  let dashedLine = '';
  while(dashedLine.length < projectMetadata.projectSettings.title.length + 23) {
    dashedLine += '-';
  }
  console.log(chalk.white('\n★ ' + dashedLine + ' ★'));
  console.log(chalk.white('| ') +
    chalk.green('Successfully compiled ') +
    chalk.white(projectMetadata.projectSettings.title) +
    chalk.green('!') +
    chalk.white(' |'));
  console.log(chalk.white('★ ' + dashedLine + ' ★\n'));
};


module.exports = {compile: compile};
