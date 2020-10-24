"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib"),
argv = require('minimist')(process.argv.slice(2)),
 fs_1 = tslib_1.__importDefault(require("fs")),
 mkdirp_1 = tslib_1.__importDefault(require("mkdirp")),
 path_1 = tslib_1.__importDefault(require("path")),
 commandOptions_1 = tslib_1.__importStar(require("dtsgenerator/dist/commandOptions")),
 core_1 = tslib_1.__importStar(require("dtsgenerator/dist/core")),
 config_1 = tslib_1.__importStar(require("dtsgenerator/dist/core/config")),
 typescript_1 = tslib_1.__importDefault(require("typescript"));

function readConfig(options) {
    var pc = {};
    var configFile = options.configFile || commandOptions_1.defaultConfigFile;
    try {
        pc = loadJSON(configFile);
        pc.configFile = configFile;
    }
    catch (err) {
        if (options.configFile != null) {
            console.error('Error to load config file from ' + options.configFile);
        }
    }
    if (pc.input == null) {
        pc.input = {
            files: [],
            urls: [],
            stdin: false,
        };
    }
    if (options.files.length > 0) {
        pc.input.files = options.files;
    }
    else if (pc.input.files == null) {
        pc.input.files = [];
    }
    if (options.urls.length > 0) {
        pc.input.urls = options.urls;
    }
    else if (pc.input.urls == null) {
        pc.input.urls = [];
    }
    pc.input.stdin = options.isReadFromStdin();
    if (options.out != null) {
        pc.outputFile = options.out;
    }
    if (options.target != null) {
        pc.target = convertToScriptTarget(options.target);
    }
    pc.outputAST = !!options.outputAST;
    return pc;
}
function loadJSON(file) {
    var content = fs_1.default.readFileSync(file, 'utf-8');
    return JSON.parse(content);
}
function convertToScriptTarget(target) {
    switch (target.trim().toLowerCase()) {
        case 'es3':
            return typescript_1.default.ScriptTarget.ES3;
        case 'es5':
            return typescript_1.default.ScriptTarget.ES5;
        case 'es2015':
            return typescript_1.default.ScriptTarget.ES2015;
        case 'es2016':
            return typescript_1.default.ScriptTarget.ES2016;
        case 'es2017':
            return typescript_1.default.ScriptTarget.ES2017;
        case 'es2018':
            return typescript_1.default.ScriptTarget.ES2018;
        case 'es2019':
            return typescript_1.default.ScriptTarget.ES2019;
        case 'es2020':
            return typescript_1.default.ScriptTarget.ES2020;
        case 'esnext':
            return typescript_1.default.ScriptTarget.ESNext;
        default:
            return typescript_1.default.ScriptTarget.Latest;
    }
}
function loadContents() {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var contents, ps, _a, _b, pattern, _c, _d, url;
        var e_1, _e, e_2, _f;
        return tslib_1.__generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    contents = [];
                    ps = [];
                    if (config_1.default.input.stdin) {
                        ps.push(core_1.readSchemaFromStdin().then(function (s) {
                            contents.push(s);
                        }));
                    }
                    try {
                        for (_a = tslib_1.__values(config_1.default.input.files), _b = _a.next(); !_b.done; _b = _a.next()) {
                            pattern = _b.value;
                            ps.push(core_1.readSchemasFromFile(pattern).then(function (ss) {
                                contents = contents.concat(ss);
                            }));
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (_b && !_b.done && (_e = _a.return)) _e.call(_a);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                    try {
                        for (_c = tslib_1.__values(config_1.default.input.urls), _d = _c.next(); !_d.done; _d = _c.next()) {
                            url = _d.value;
                            ps.push(core_1.readSchemaFromUrl(url).then(function (s) {
                                contents.push(s);
                            }));
                        }
                    }
                    catch (e_2_1) { e_2 = { error: e_2_1 }; }
                    finally {
                        try {
                            if (_d && !_d.done && (_f = _c.return)) _f.call(_c);
                        }
                        finally { if (e_2) throw e_2.error; }
                    }
                    return [4, Promise.all(ps)];
                case 1:
                    _g.sent();
                    return [2, contents];
            }
        });
    });
}
function exec({openApiSrc,outputFile}) {


    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var command, pc, version, contents, result;
        return tslib_1.__generator(this, function (_a) {

            switch (_a.label) {
                case 0:

                     let args=process.argv.slice(0,2).concat([
                      '-o',
                      `${outputFile}` ,
                      `${openApiSrc}`

                    ])
                    console.log(args);
                    command = commandOptions_1.initialize(args);
                    //console.log(command);
                    pc = readConfig(commandOptions_1.default);               ;

                    config_1.setConfig(pc);
                    if (!commandOptions_1.default.info) return [3, 2];
                    version = command.opts().version;
                    return [4, config_1.showConfig(version, config_1.default)];
                case 1:
                    _a.sent();
                    return [2];
                case 2: return [4, loadContents()];
                case 3:
                    contents = _a.sent();
                    return [4, core_1.default({
                            contents: contents,
                        })];
                case 4:
                    result = _a.sent();
                    if (commandOptions_1.default.out) {
                        mkdirp_1.default.sync(path_1.default.dirname(commandOptions_1.default.out));
                        fs_1.default.writeFileSync(commandOptions_1.default.out, result, { encoding: 'utf-8' });
                    }
                    else {
                        console.log(result);
                    }
                    return [2];
            }
        });
    });
}
module.exports=exec;
//# sourceMappingURL=cli.js.map
