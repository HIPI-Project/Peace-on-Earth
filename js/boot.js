"use strict";

var incompatible = [];

if(!document.addEventListener)
	incompatible.push("document.addEventListener");

if (typeof Promise === 'undefined')
	incompatible.push("Promise");

if (!Array.prototype.map)
	incompatible.push("Array.map");

if (!Array.prototype.forEach)
	incompatible.push("Array.forEach");

if (!Array.prototype.filter)
	incompatible.push("Array.filter");

if (!Array.isArray)
	incompatible.push("Array.isArray");

if(incompatible.length){

	var incompatibleMsg = "The following features are required by this application. Please use a newer web browser to continue. " +
							"<ul><li>" +
							incompatible.join("</li><li>") + 
							"</li></ul>";

	document.getElementsByTagName("app")[0].innerHTML = incompatibleMsg;
}
else{

	document.addEventListener("DOMContentLoaded", function() { 

		// This is one of 2 global variables used by this application.
		// window.HIPI contains pointers to all other modules and should be used throughout the codebase to simulate dependency injection.
		window.HIPI = new AppContainer();

		// Don't try to instantiate the individual Components until the window.HIPI object has been instantiated.
		// This is the second global variable in use by the application.
		if(window.delayedComponentCreationArr){

			for(var i=0; i<window.delayedComponentCreationArr.length; i++){

				HIPI.framework.Utilities.ensureTypeFunction(window.delayedComponentCreationArr[i]);

				window.delayedComponentCreationArr[i]();
			}
		}

		// Load the initial application state from the JSON file on disk. 
		window.HIPI.framework.AppState.loadStore()
		.then(function(){

			// Run a reducer action to synchronously cache some properties on the global store.
			HIPI.state.ActionMethods.initializeStore();

			// Kick start the application by rendering the <initialize> component.
			document.getElementsByTagName("app")[0].innerHTML = HIPI.framework.View.renderHtml("<main>... Please Wait ...</main>");

			// This will run any initialization callbacks on the Component instances which are needed to bind events to the DOM.
			HIPI.framework.ComponentCollection.runDomBindRoutinesIfNeeded();
		})
		.catch(function(error){

			// It is possible that the AppState.loadStore() Promise will become rejected because the an "Action ID" is not found within the URL (either during start-up or when the user hits their BACK button past ActionID=start). 
			// If such a rejection string is returned it is assumed that AppState.loadStore() will take care of redirecting the browser... in which case just show a redirection message instead of an error.
			if((""+error) === HIPI.framework.Constants.redirectingToStartPagePromiseRejectionString()){

				document.getElementsByTagName("app")[0].innerHTML = "Redirecting, please wait ...";

				return;
			}

			document.getElementsByTagName("app")[0].innerHTML = "An error occurred while trying to initialize the database from <span style='font-family:monospace;'>cortex.json</span>.  Please ensure that your localhost server is running. " +
																"<ol>" + 
																	"<li>Install 'npm' on your system. This is easily accomplished with the 'node.js installer'.</li>"+
																	"<li>Open a shell window and navigate to the directory where this software has been installed and run the following command.<br/><span style='font-family:monospace;'>npm run start</span></li>"+
																	"<li>The server will start and provide a URL for you to copy and paste into the web browser.<br/><span style='font-family:monospace;'>http://127.0.0.1:2828</span></li>"+
																"</ol>" + 
																"<p>Error Message: <br/>" + error;

			return Promise.reject(error);
		});
	});	
}
