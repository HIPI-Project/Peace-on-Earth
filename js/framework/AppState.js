"use strict";

function AppState() {

	if (AppState._instanceAlreadyCreated) {
		if(console && console.warn)
			console.warn("Another instance of the AppState has been generated. There should only be 1 instantiated for the lifetime of the application.");
	}
	AppState._instanceAlreadyCreated = true;

	this.urlToPublicJsonStore = "brain/cortex.json";
	this.urlToPrivateJsonStore = "body.json";

	this._currentStore = null;
	this._initialStore = null;

	this._eventsObj_StoreChanged;

	this._actionHistory = [];

	this._storeIsBeingSaved = false;
	this._storeSaveBacklogRequestCounter = 0;

	this._reducersArr = [];
	this._stateCleanerArr = [];

	this._isHtml5PushStateAvailable = ('history' in window && 'pushState' in history) ? true : false;

	if(this._isHtml5PushStateAvailable){

		var scopeThis = this; 

		// This could take considerable work to replay all of the a action objects on top of the initial state.
		// If a performance impact is detected (hitting BACK/FORWARD) on a large database with a large number of actions it seems like a good idea to store "new state bases" every X number of actions.
		// The additional "base states" could be stored in local storage and referenced within the Push State objects.
		// This way the system will only need to replay the actions on top of closest "base state", meaning that there are less actions to process.
		window.addEventListener('popstate', function(e) {

			console.log("Pop State: Received a event:", e.state);

			var actionHistoryArrFromPopState = [];

			if(e.state && e.state.actionHistory){

				actionHistoryArrFromPopState = e.state.actionHistory;

				if(!Array.isArray(actionHistoryArrFromPopState))
					throw new Error("Error in AppState, 'popstate' event handler. The 'actionHistory' key was available on the state object but it is not of type Array:", actionHistoryArrFromPopState);
			}
			else{
				console.log("Pop State: There is not a state object on the HTML5 Push State, resetting the application back to its initial state. ");
			}

			var newStore = HIPI.framework.Utilities.copyObject(scopeThis._initialStore);

			// Replay all of the Actions from the History Array on top of the initial store.
			// It would be easier to just put the entire State object onto the HTML5 PushState entry, but this database could grow very large and some vendors put size constraints on the PushState API.
			for(var i=0; i<actionHistoryArrFromPopState.length; i++){

				// Run any reducers attached to this application (defined outside of the Components themselves).
				for(var j=0; j<scopeThis._reducersArr.length; j++){

					var loop_StoreObj = scopeThis._reducersArr[j](newStore, actionHistoryArrFromPopState[i]);

					newStore = HIPI.framework.Utilities.copyObject(loop_StoreObj);
				}

				// Run any reducers defined within the Components.
				newStore = HIPI.framework.ComponentCollection.runComponentReducers(newStore, actionHistoryArrFromPopState[i]);
			}

			scopeThis._currentStore = newStore;

			if(scopeThis._eventsObj_StoreChanged)
				scopeThis._eventsObj_StoreChanged.fire();

			HIPI.framework.ComponentCollection.runDigestCycle();

			HIPI.framework.AppState.saveStore()
			.then(function(){
				console.log("Store was saved successfully after navigating to a new position in the browser history.");
			});
		});
	}
};

// This is one of two places where Reducers can be added.
// Any Reducer functions added here will run before the Component Reducers in FIFO.
// Components can also define their own Reducers within the definition files. 
AppState.prototype.addReducerFunction = function (reducerFunction) {

	HIPI.framework.Utilities.ensureTypeFunction(reducerFunction);

	this._reducersArr.push(reducerFunction);
};

// This is one of two places where a State Cleaner function can be added.
// Components can also define their own State Cleaners within the definition files. 
// The purpose of the State Cleaners are to remove any data from the Store before persisting the state to disk.
// For example, the "current user's" position(s) might exist in the global State object but that stuff is not something which should be shared with others.
// In other words, it is any type of data that should be lost after restarting the application, such as refreshing the browser.
AppState.prototype.addStateCleanerFunction = function (stateCleanupFunction) {

	HIPI.framework.Utilities.ensureTypeFunction(stateCleanupFunction);

	this._stateCleanerArr.push(stateCleanupFunction);
};

// The event will fire before the digest cycle runs. 
AppState.prototype.subscribeToStoreChangedEvents = function (functionReference, functionArgumentsArr, objectRefForEvent) {

	if(!this._eventsObj_StoreChanged)
		this._eventsObj_StoreChanged = new HIPI.framework.Events();

	this._eventsObj_StoreChanged.addSubscription(functionReference, functionArgumentsArr, objectRefForEvent);
};

AppState.prototype.dispatchAction = function (actionObj) {

	HIPI.framework.Utilities.ensureTypeObject(actionObj);

	if(typeof actionObj.type !== "string" || !actionObj.type)
		throw new TypeError("Error in AppState.dispatchAction. The action object must always contain a non-empty string for the 'type' property.");

	console.log("Dispatching Action: ", actionObj);

	if(this._isHtml5PushStateAvailable){

		var newActionHistoryArr = this._getActionHistoryFromCurrentHistoryState();

		newActionHistoryArr.push(actionObj);

		this._actionHistory.push(actionObj);

		history.pushState({"actionHistory": newActionHistoryArr}, null, (HIPI.framework.Constants.getApplicationFileName() + "?action=" + this._actionHistory.length));
	}

	var newStore = HIPI.framework.Utilities.copyObject(this._currentStore);

	// Reducers take the current state and action, then returns a copy of the new state using "pure functions".
	for(var i=0; i<this._reducersArr.length; i++)
		newStore = this._reducersArr[i](newStore, actionObj);

	// Now let the Component Reducers work on the copy.
	newStore = HIPI.framework.ComponentCollection.runComponentReducers(newStore, actionObj);

	this._currentStore = newStore;

	if(this._eventsObj_StoreChanged)
		this._eventsObj_StoreChanged.fire();

	HIPI.framework.ComponentCollection.runDigestCycle();
};

AppState.prototype.setStoreObj = function (storeObj) {

	HIPI.framework.Utilities.ensureTypeObject(storeObj);

	this._currentStore = HIPI.framework.Utilities.copyObject(storeObj);

	console.log("Store object overridden", this._currentStore);

	if(this._eventsObj_StoreChanged)
		this._eventsObj_StoreChanged.fire();

	HIPI.framework.AppState.runDigestCycle();
};

AppState.prototype.getStoreObj = function () {

	if(!this._currentStore)
		throw new Error("Error in AppState.getStoreObj. The Store is being requested before it has been loaded.");

	return HIPI.framework.Utilities.copyObject(this._currentStore);
};

// The following 2 methods contain application-specific code for bisecting the global state object into public/private parts.
// It would be better to run this logic through callback methods (maybe attached through boot.js) to keep this AppState class abstract.
AppState.prototype.getPublicStoreObj = function (globalStoreObj) {

	HIPI.framework.Utilities.ensureTypeObject(globalStoreObj);

	globalStoreObj = HIPI.framework.Utilities.copyObject(globalStoreObj);

	delete globalStoreObj.privateState;

	return globalStoreObj;
};

AppState.prototype.getPrivateStoreObj = function (globalStoreObj) {

	HIPI.framework.Utilities.ensureTypeObject(globalStoreObj);

	globalStoreObj = HIPI.framework.Utilities.copyObject(globalStoreObj);

	if(globalStoreObj.privateState)
		return globalStoreObj.privateState;
	else
		return {};
};

AppState.prototype.loadStore = function () {

	if(this._currentStore)
		throw new Error("Error in AppState.loadStore. Cannot load the store after it has already been loaded.");

	var scopeThis = this;

	// If someone refreshes the browser it doesn't clear the PushState history, it just adds another entry.
	// The problem is that the "initial store" is reloaded from disk after a refresh so the Action History events get replayed on top of an unpredictable base.
	if(scopeThis._isHtml5PushStateAvailable){

		var currentURL = new String(window.location).toString();

		if(!currentURL.match(/\?action=start/)){

			currentURL = currentURL.replace(/\?.*$/, "");
			currentURL = currentURL.replace(HIPI.framework.Constants.getApplicationFileName(), "");

			currentURL += HIPI.framework.Constants.getApplicationFileName() + "?action=start";

			window.location.replace(currentURL);

			return Promise.reject(HIPI.framework.Constants.redirectingToStartPagePromiseRejectionString());
		}
	}

	return HIPI.framework.Utilities.getAjax(this.urlToPublicJsonStore)
	.then(function(publicJsonStr){

		try{

			scopeThis._currentStore = JSON.parse(publicJsonStr);

			console.log("The Public Store object has been fetched from the server.", scopeThis._currentStore);
		}
		catch(e){

			return Promise.reject("Unable to parse the public JSON store '"+scopeThis.urlToPublicJsonStore+"'.  It's possible that the file has been corrupted. Consider rolling back the state of this file using your version control software.");
		}

		// Add another Promise to the chain.
		return HIPI.framework.Utilities.getAjax(scopeThis.urlToPrivateJsonStore);
	})
	.then(function(privateJsonStr){

		try{

			var privateStoreObj = JSON.parse(privateJsonStr);

			// Merge the private store object into the global state within its own key.
			scopeThis._currentStore.privateState = privateStoreObj;

			// The initial store object is only needed so that the HTML5 Push State can replay actions on top of a base (i.e. whenever Back/Forward is used).
			scopeThis._initialStore = HIPI.framework.Utilities.copyObject(scopeThis._currentStore);

			console.log("The Private Store object has been fetched from the server and merged into the current store.", scopeThis._currentStore);
		}
		catch(e){

			return Promise.reject("Unable to parse the private JSON store '"+scopeThis.urlToPrivateJsonStore+"'.  It's possible that the file has been corrupted. Consider rolling back the state of this file using your version control software or erase the contents of the file and restart this application.");
		}
	})
	.catch(function(err){

		return Promise.reject("Unable to fetch the store from the server. Error: " + err);
	});
};

AppState.prototype.saveStore = function () {

	if(!this._currentStore)
		throw new Error("Error in AppState.saveStore. Cannot save the store before it has been loaded.");

	// If the database grows large it could take some time to "clean the state" and save to disk.
	// This conditional will prevent overlapping asynchronous requests while ensuring that the last call is honored.
	if(this._storeIsBeingSaved){

		this._storeSaveBacklogRequestCounter++;

		console.log("In AppState.saveStore. Received another request to save the store while a save process is currently underway. Marking a backlog request, will try re-saving once the current request completes. Total backlog requests: " + this._storeSaveBacklogRequestCounter);

		// Let the calling code know that the store wasn't actually saved, but without raising any concerns through a rejected promise.
		return Promise.resolve({"delayedSave": true, "backlogRequestCounter":this._storeSaveBacklogRequestCounter});
	}

	this._storeIsBeingSaved = true;

	var globalStoreForPersist = this._getCleanCopyOfStoreForDisk();
	var publicStoreForPersist = this.getPublicStoreObj(globalStoreForPersist);
	var privateStoreForPersist = this.getPrivateStoreObj(globalStoreForPersist);

	var scopeThis = this;

	return HIPI.framework.Utilities.postAjax(this.urlToPublicJsonStore, JSON.stringify(publicStoreForPersist, null, '\t'))
	.then(function(resultStr){

		if(resultStr !== "OK")
			return Promise.reject("Received an unexpected response while trying to persist the public data store to URL: " + scopeThis.urlToPublicJsonStore);

		// Chain link another promise onto the save routine.
		return HIPI.framework.Utilities.postAjax(scopeThis.urlToPrivateJsonStore, JSON.stringify(privateStoreForPersist, null, '\t'))
	})
	.then(function(resultStr){

		if(resultStr !== "OK")
			return Promise.reject("Received an unexpected response while trying to persist the private data store to URL: " + scopeThis.urlToPrivateJsonStore);

		// Don't acknowledge that the store has been saved until both private & public objects have successful server-side responses.
		scopeThis._storeIsBeingSaved = false;

		if(scopeThis._storeSaveBacklogRequestCounter){

			console.log("In AppState.saveStore. The last save operation completed with "+scopeThis._storeSaveBacklogRequestCounter+" pending backlog request(s). Going to try re-saving the store now.");

			scopeThis._storeSaveBacklogRequestCounter = 0;

			// This will return a Promise which may lengthen the time it takes for the first request to resolve.
			// Any subsequent requests )which incremented this._storeSaveBacklogRequestCounter would have had their promises resolve almost immediately.
			return scopeThis.saveStore();
		}
	})
	.catch(function(err){

		scopeThis._storeIsBeingSaved = false;

		scopeThis._storeSaveBacklogRequestCounter = 0;

		return Promise.reject("Unable to save the store to the server. Is it still running? Error: " + err);
	});
};

// This method will return a copy of the current store with all session-specific date removed.
// Essentially this returns an application state that is suitable for sharing with everyone else, much like the way that it was found when the application started.
AppState.prototype._getCleanCopyOfStoreForDisk = function () {

	// Always work with copies when dealing with "pure functions".
	var storeClone = HIPI.framework.Utilities.copyObject(this._currentStore);

	// Cleaners take the current state and return a copy without any session-specific data.
	for(var i=0; i<this._stateCleanerArr.length; i++){

		var loop_StoreObj = this._stateCleanerArr[i](storeClone);

		storeClone = HIPI.framework.Utilities.copyObject(loop_StoreObj);
	}

	// Now let the Components clean up anything they need on the copy.
	return HIPI.framework.ComponentCollection.runComponentStateCleaners(storeClone);
};

// This will return an array of Action Objects held within the HTML History API (whatever the current position is).
// If there aren't any history records yet this method will return an empty array. 
AppState.prototype._getActionHistoryFromCurrentHistoryState = function () {

	if(!this._isHtml5PushStateAvailable)
		throw new Error("Error in _getActionHistoryFromCurrentHistoryState. This method cannot be called on browsers which do not support the HTML5 pushState API.");

	var actionHistoryArr = [];

	if(window.history && window.history.state)
		actionHistoryArr = window.history.state.actionHistory;

	if(!Array.isArray(actionHistoryArr))
		throw new Error("Error in AppState._getActionHistoryFromCurrentHistoryState. The 'actionHistory' key was available on the state object but it is not of type Array:", actionHistoryArr);

	return actionHistoryArr;
};