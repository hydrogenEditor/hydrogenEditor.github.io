"use strict";

var workingFolder = "";
var rootFolder = (process.env.HOME || "c:\\"+process.env.HOMEPATH || process.env.USERPROFILE);
var wsFolder = "/Documents/hydrogen3/projects";
var piFolder = "/Documents/hydrogen3/plugins";

var fs = require('fs');

makeRootFolders();

function setCurrentWS(name){
	workingFolder = name;
	UI.tree.loadStarter();
	setupTree();
	sessionManager.newTemp("","");
	remove_CreatePanel();
	setTimeout(function(){
		UI.drawbar.destroy();
		UI.tree.loadStarter();
		bumpRecents(workingFolder,rootFolder + wsFolder + "/" + workingFolder);
		refreshTree();
		setupTree();
	},500);
	win.title="hydrogen - "+name;
	document.title = "hydrogen - "+name;
	eventManager.triggerEvent('readyForPlugin');
	buildManager.setBuildType(microManager.appOptions.getBuildType());
	if (buildManager.projectType.is.app) microManager.start();
}

function makeRootFolders(){
	var folders = [rootFolder+"/Documents/hydrogen3", rootFolder+wsFolder, rootFolder+piFolder];
	for (var i = 0; i < folders.length; i++) {
		try{ 
			fs.mkdirSync(folders[i]); 
		}catch(s){
// 			console.error(s);
		}
	}
}

function createProject(name){
	workingFolder = name;
	buildManager.setBuildType( $('#pointer-hover-button').text() );
	makeRootFolders();
	try{
		setupDirectory();
	}
	catch(ex){
		changeStatus("This project already exists!",2);
		console.log(ex);
	}
	UI.tree.loadStarter();
	setupTree();
	sessionManager.newTemp("","");
	remove_CreatePanel();


	if (buildManager.projectType.is.app) {
		if (buildManager.projectType.source = 'com.hydrogen.framework:app.apple') {
			microManager.appOptions.create.ios(name);
			buildManager.buildApp();
		}
		microManager.start();
	}


	setTimeout(function(){
		UI.drawbar.destroy();
		UI.tree.loadStarter();
		bumpRecents(workingFolder,rootFolder + wsFolder + "/" + workingFolder);
	},1000);
	win.title="hydrogen - "+name;
	document.title = "hydrogen - "+name;
	eventManager.triggerEvent('readyForPlugin');
	setTimeout(function(){ refreshTree(); setupTree(); }, 1000);
}

function setupDirectory(){
	fs.mkdirSync(rootFolder + wsFolder+"/"+ workingFolder);
	createFolderUser("Components");
	fs.closeSync(fs.openSync(rootFolder + wsFolder+"/"+ workingFolder + "/" +"style.css", 'w'));
}

function createFolderUser(folderName,folderRoot){
	folderRoot = (folderRoot || rootFolder + wsFolder+"/"+ workingFolder);
	try{ fs.mkdirSync(folderRoot + "/" + folderName) } catch(v) {}
}

function setupTree(){
	$('#tree').on('nodeSelected', function(event, data) {
		saveAllUnsaved();
		var p = buildPathFromTree(data).local;
		var dataNode = data;
		var vtype = checkTypePath(buildPathFromTree(data).direct);
		if (vtype == "file"){
			createBreadCrumb("/"+p);
			changeStatus( p.replace("My Project",rootFolder + wsFolder+"/"+ workingFolder) ,1);
			sessionManager.changeSession( p.replace("My Project",rootFolder + wsFolder+"/"+ workingFolder) );

			var cont = require('fs').readFileSync(p.replace("My Project",rootFolder + wsFolder+"/"+ workingFolder), { encoding: 'utf8' });
			var pathr = p.replace("My Project",rootFolder + wsFolder+"/"+ workingFolder);
			if (cont != editor.getSession().getValue()) editor.getSession().setValue(cont);
			editor.getSession().setMode(buildMode(pathr));
			enable_editor();
		}
		else{
			console.log("this data is of type "+ vtype);
			sessionManager.newTemp("","");
			disable_editor();
		}
	});
	
	$('#tree').treeview('expandAll');
}

function goCustom(){
	$(document.body).append( $('<input type="file" style="display:none;" id="prof" nwdirectory>') );
	$('#prof').unbind('change');
	$('#prof').change(function(evt) {
		var xfpath = $(this).val();
		var xfname = path.basename(xfpath);
		copyFolderRecursiveSync(xfpath,rootFolder+wsFolder);
		goto_continue();
		setCurrentWS(xfname);
	});

    	$('#prof')[0].click(); 
}

function copyFileSync( source, target ) {

	var targetFile = target;

	//if target is a directory a new file with the same name will be created
	if ( fs.existsSync( target ) ) {
		if ( fs.lstatSync( target ).isDirectory() ) {
			targetFile = path.join( target, path.basename( source ) );
		}
	}

	fs.writeFileSync(targetFile, fs.readFileSync(source));
}

function copyFolderRecursiveSync( source, target ) {
	var files = [];

	//check if folder needs to be created or integrated
	var targetFolder = path.join( target, path.basename( source ) );
	if ( !fs.existsSync( targetFolder ) ) {
		fs.mkdirSync( targetFolder );
	}

	//copy
	if ( fs.lstatSync( source ).isDirectory() ) {
		files = fs.readdirSync( source );
		files.forEach( function ( file ) {
			var curSource = path.join( source, file );
			if ( fs.lstatSync( curSource ).isDirectory() ) {
				copyFolderRecursiveSync( curSource, targetFolder );
			} else {
				copyFileSync( curSource, targetFolder );
			}
		} );
	}
}

function saveAllUnsaved(){
	eventManager.triggerEvent('save');
	$.each(editSessions, function(k, v) {
			if (v != undefined) fs.writeFileSync( k , v.getDocument().$lines.join("\n") );	
	});
}

function getFilesInFolder(fpath){
	var filesHere = require("fs").readdirSync(fpath);
	return filesHere;
}

// getFilesInFolder(rootFolder + wsFolder);

function buildMode(path){
	if (getFileExtension(path).toLowerCase() == "js"){
		return "ace/mode/javascript";
	}
	else if (getFileExtension(path).toLowerCase() == "json"){
		return "ace/mode/json";
	}
	else if (getFileExtension(path).toLowerCase() == "html"){
		return "ace/mode/html";
	}
	else if (getFileExtension(path).toLowerCase() == "sdml"){
		return "ace/mode/html";
	}
	else if (getFileExtension(path).toLowerCase() == "cdml"){
		return "ace/mode/html";
	}
	else if (getFileExtension(path).toLowerCase() == "xml"){
		return "ace/mode/xml";
	}
	else if (getFileExtension(path).toLowerCase() == "css"){
		return "ace/mode/css";
	}
	else if (getFileExtension(path).toLowerCase() == "md"){
		return "ace/mode/markdown";
	}
	else{
		return ""
	}
}

function getFileExtension(url) {
	"use strict";
	if (url === null) {
		return "";
	}
	var index = url.lastIndexOf("/");
	if (index !== -1) {
		url = url.substring(index + 1); // Keep path without its segments
	}
	index = url.indexOf("?");
	if (index !== -1) {
		url = url.substring(0, index); // Remove query
	}
	index = url.indexOf("#");
	if (index !== -1) {
		url = url.substring(0, index); // Remove fragment
	}
	index = url.lastIndexOf(".");
	return index !== -1
		? url.substring(index + 1) // Only keep file extension
		: ""; // No extension found
}

function checkTypePath(path){
	var fs = require('fs');
	var theType = "";
	console.log("checking " + path + " . . .");
	try {
		var stats = fs.lstatSync(path);
		if (stats.isDirectory()) theType = "directory";
		if (stats.isFile()) theType = "file";
	}
	catch (e) {
		console.log(e);
		theType = "unknown";
	}
	return theType;
}

function genTreeJSON(struct){
	var b = JSON.parse("["+JSON.stringify(struct).replace(workingFolder,"My Project").replace(/name/g,"text").replace(/children/g,"nodes")+"]");
	return b;
}

function dirTree(filename) {
	var fs = require('fs');
	var path = require('path');
	var stats = fs.lstatSync(filename),
		info = {
			// path: filename,
			name: path.basename(filename)
		};

	if (stats.isDirectory()) {
		// info.type = "folder";
		info.children = fs.readdirSync(filename).map(function(child) {
			return dirTree(filename + '/' + child);
		});
	} else {
		// Assuming it's a file. In real life it could be a symlink or
		// something else!
		// info.type = "file";
	}

	return info;
}

function buildPathFromTree(data){
	var p = data.text;
	var index = data.nodeId;
	while (index > 0){
		p = $('#tree').treeview('getNode', data.parentId).text + "/" + p;
		data = $('#tree').treeview('getNode', data.parentId);
		index = data.nodeId;
	}
	return {
		direct:p.replace("My Project",rootFolder + wsFolder+"/"+ workingFolder),
		local:p
	}
}

function generateUKey(){
	return Math.random().toString(36).substr(2, 17);
}

// new interface('web-component',{
// 	id:'nav',
// 	styles:['navStyle.css'],
// 	scripts['myActions.js']	,
// 	order:'async'
// });

function createWSItem(name,ftype,withStuff) {
	console.log("Creating "+ ftype + " named " + name);
	changeStatus("Created "+ ftype + " named " + name, 3);
	var selectedPath = "";
	try{
		selectedPath = buildPathFromTree( $('#tree').treeview('getSelected')[0] ).direct;
		if (checkTypePath(selectedPath) != 'directory'){
			selectedPath = rootFolder + wsFolder+"/"+ workingFolder;
		}
	}catch(v){
		selectedPath = rootFolder + wsFolder+"/"+ workingFolder;
	}
	if (ftype == "Components"){
		fs.closeSync(fs.openSync(rootFolder + wsFolder+"/"+ workingFolder + "/" +"Components" + "/" + name +".cdml", 'w'));
		var c = "\n\nnew ComponentInterface('web-component',{\n\tname:'"+name+".cdml',\n\tstyles:[],\n\tscripts:[],\n\torder:'defer'\n});";
		fs.appendFileSync(rootFolder + wsFolder+"/"+ workingFolder + "/" +"Components" + "/interfaces.js",c);	
		var c2 = "<"+name+" id='REPLACE_ME'>\n\t\n</"+name+">";
		fs.writeFileSync(rootFolder + wsFolder+"/"+ workingFolder + "/" +"Components" + "/" + name +".cdml",c2);	
	}
	else if (ftype == "Segment"){
		fs.closeSync(fs.openSync(rootFolder + wsFolder+"/"+ workingFolder + "/" +"Segments" + "/" + name +".js", 'w'));
		fs.closeSync(fs.openSync(rootFolder + wsFolder+"/"+ workingFolder + "/" +"Segments" + "/" + name +".sdml", 'w'));
		var c = "\nclass "+name+" extends segmentInterface{\n\tconstructor(){\n\t\tsuper('i_"+name+"')\n\t}\n}";
		fs.writeFileSync(rootFolder + wsFolder+"/"+ workingFolder + "/" +"Segments" + "/" + name +".js",c);	
		var c2 = "<segment id='i_"+name+"'>\n\t\n</segment>";
		fs.writeFileSync(rootFolder + wsFolder+"/"+ workingFolder + "/" +"Segments" + "/" + name +".sdml",c2);	
	}
	else if (ftype == "IOS App"){
		fs.closeSync(fs.openSync(rootFolder + wsFolder+"/"+ workingFolder + "/build.json", 'w'));
		var c = {
			'name':name,
			'access':'com.myCompany.'+name.replace(' ','_'),
			'platform':'ios',
			'version':'0.0.0.1',
			'type':'hybrid',
			'permissions':[
				'cordova-plugin-device',
				'phonegap-plugin-push',
				'cordova-plugin-splashscreen',
				'cordova-plugin-network-information'
			]
		}
		fs.writeFileSync(rootFolder + wsFolder+"/"+ workingFolder + "/build.json",JSON.stringify(c, null, "\t"));
	}
	else if (ftype == "Folder"){
		if (selectedPath == rootFolder + wsFolder+"/"+ workingFolder){
			createFolderUser(name);
		}
		else{
			createFolderUser(name,selectedPath);
		}
	}
	else if (ftype == "Class" || ftype == "JS File"){
		fs.closeSync(fs.openSync(selectedPath + "/" + name +".js", 'w'));
		if (withStuff != undefined) {
			fs.writeFileSync(selectedPath+ "/" + name +".js",createItemPanelContent);
		}
		else{
			var c = "class "+name+"{\n\tconstructor(){\n\t\n\t}\n}";
			fs.writeFileSync(selectedPath + "/" + name +".js",c);			
		}
	}
	else if (ftype == "HTML File"){
		fs.closeSync(fs.openSync(selectedPath+ "/" + name +".html", 'w'));
		if (withStuff != undefined){
			fs.writeFileSync(selectedPath + "/" + name +".html",createItemPanelContent);
		}
		else{
			var c = "<!DOCTYPE html>\n<html>\n\t<head>\n\t\t<title>"+name+"</title>\n\t</head>\n\t<body>\n\t\n\t</body>\n</html>";
			fs.writeFileSync(selectedPath+ "/" + name +".html",c);
		}
	}
	else if (ftype == "StyleSheet"){
		fs.closeSync(fs.openSync(selectedPath + "/" + name +".css", 'w'));
		if (withStuff != undefined) fs.writeFileSync(selectedPath + "/" + name +".css",createItemPanelContent);
	}
	else{
		fs.closeSync(fs.openSync(selectedPath + "/" + name , 'w'));
		if (withStuff != undefined) fs.writeFileSync(selectedPath+ "/" + name ,createItemPanelContent);
	}
	$('#panel_Create_new').remove();
	refreshTree();
	createItemPanelContent = "";
	// ace.edit("editor").getSession().setValue("");
	setupTree();
}

var fs = require('fs');
function deleteFolderRecursive(path) {
	if( checkTypePath(path) == 'directory'  && path != "" && path != "/") {
		fs.readdirSync(path).forEach(function(file,index){
			var curPath = path + "/" + file;
			if(fs.lstatSync(curPath).isDirectory()) { // recurse
				deleteFolderRecursive(curPath);
			} else { // delete file
				fs.unlinkSync(curPath);
			}
		});
		fs.rmdirSync(path);
	}
};

function refreshTree(){
	var struct = dirTree(rootFolder + wsFolder + "/" + workingFolder);
	var treeX = genTreeJSON(struct);
	$('#tree').treeview({
		data:treeX
	});
	$('#tree').treeview('expandAll');
}

function createBreadCrumb(path){
	$('.breadcrumb').empty();
	var sec = path.replace(wsFolder,"").split("/");
	for (var i = 0; i < sec.length; i++) {
		if (i == 0){

		}
		else if ((i > sec.length-2)==false){
			$('.breadcrumb').append($('<li><a href="#">'+sec[i]+'</a></li>'));
		}
		else{
			$('.breadcrumb').append($('<li>'+sec[i]+'</li>'));
		}
	}
}