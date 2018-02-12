"use strict";

var http = require('http');
var fs = require('fs');
var path = require('path');

http.createServer(function (request, response){

	console.log(request.url);

	if(request.method == 'POST'){

		var postFileNameAndPath = path.join(__dirname, path.dirname(request.url), path.basename(request.url));

		console.log("About to write the POST body to the filename: " + postFileNameAndPath);

		var body = '';

		request.on('data', function(data) {
			body += data;
		});

		request.on('end', function(){

			fs.writeFile(postFileNameAndPath, body, function(err){

				if(err){

					var errorMessage = "Unable to write the POST data to disk: " + err;

					console.log(errorMessage);

					response.writeHead(500, {'Content-Type': 'text/html'});

					response.end(errorMessage);
				}
				else{

					console.log("File saved.");

					response.writeHead(200, {'Content-Type': 'text/html'});

					response.end('OK');
				}
			});
		});
	}
	else{

		var filePath = '.' + request.url;

		if(filePath == './')
			filePath = './index.html';

		// Get rid of possible query strings.
		filePath = filePath.replace(/\?.*$/, "");

		var extname = path.extname(filePath);

		var contentType = 'text/html';

		switch(extname){

			case '.js':
				contentType = 'text/javascript';
				break;

			case '.css':
				contentType = 'text/css';
				break;

			case '.json':
				contentType = 'application/json';
				break;

			case '.png':
				contentType = 'image/png';
				break;

			case '.jpg':
				contentType = 'image/jpg';
				break;

			case '.wav':
				contentType = 'audio/wav';
				break;
		}

		// Add a special condition for "body.json" because this filename should be added to ".gitignore" and therefore is not possible to commit an empty file.
		// If this file is requested from the server but it does not exist on disk then just return an empty object literal.
		if(filePath.indexOf('body.json') > -1 && !fs.existsSync(filePath)){

			response.writeHead(200, { 'Content-Type': contentType });

			response.end('{}', 'utf-8');
		}
		else{

			fs.readFile(filePath, function(error, content){

				if(error){

					response.writeHead(500);

					response.end('File server error: '+error.code+' ..\n');
				}
				else{

					response.writeHead(200, { 'Content-Type': contentType });

					response.end(content, 'utf-8');
				}
			});
		}
	}
}).listen(2828);

console.log('Server running at http://127.0.0.1:2828/');