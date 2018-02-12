"use strict";

function ComponentCollection() {

	if (ComponentCollection._instanceAlreadyCreated) {
		if(console && console.warn)
			console.warn("Another instance of the ComponentCollection has been generated. There should only be 1 instantiated for the lifetime of the application.");
	}
	ComponentCollection._instanceAlreadyCreated = true;

	// This arrow holds pointers to every Component definition... regardless of how many component instances have been created. 
	this._componentObjArr = [];

	// Every time a new instance of a Component object is instantiated it should be added to this object.
	// The keys point to unique Element ID's in the DOM (if they still exist) and the values are pointers to the ComponentInstance objects.
	this._componentInstancesArr = {};

	this._isDigestCycleRunning = false;
	this._digestCycleRequestQueue = 0;
};

// It is expected that this method should be called in response to a State change.
// When invoked this method will loop over all of the Component Instances and ask them to update themselves.
// Each Component Instances should be smart enough to avoid re-rendering themselves if its segment of the State is unchanged from last time and also if they have been detached from the DOM.
ComponentCollection.prototype.runDigestCycle = function () {

	console.log("Running Digest Cycle");

	if(this._isDigestCycleRunning){

		console.log("Received another request to digest while another is in progress.");

		// There's no reason to queue up more than one request because a tailing digest will clean everything up.
		var maxDigestQueueLength = 1;
		if(this._digestCycleRequestQueue < maxDigestQueueLength)
			this._digestCycleRequestQueue++;

		return;
	}

	// Just in case any new Component Instances were inserted this will ensure that their initialization routines are executed.
	// This shouldn't be needed unless View.renderHtml() is called outside of the boot process or the ComponentInstance._forceRender() method.
	this.runDomBindRoutinesIfNeeded();

	// This method will spider the DOM for the <componentWrapper> tags and create an array of instances sorted by hierarchical depth.
	// Parent instances should be called on to re-render themselves before children because if a node is going to be removed from the DOM by a state-change it would be a waste of cycles to have it update itself.
	var componentWrapperDepthsArr = this._getComponentNodeDepths();

	// Use the same copy of the Global State throughout all components in the collection for performance. 
	var globalStateObj = HIPI.framework.AppState.getStoreObj();

	for(var i=0; i<componentWrapperDepthsArr.length; i++){

		var loop_componentWrapperId = componentWrapperDepthsArr[i].componentElemId;

		if(!this._componentInstancesArr[loop_componentWrapperId])
			throw new Error("Error in method runDigestCycle. Unable to correlate the Component Wrapper found in the DOM with an instance in the collection for Element Id: " + loop_componentWrapperId);

		// It's possible that a Component in the collection has been removed from the DOM as the current loop has been processed.
		if(!this._componentInstancesArr[loop_componentWrapperId].isComponentInDOM()){
			console.log("This component is no longer in the DOM: " + loop_componentWrapperId);
			continue;
		}

		this._componentInstancesArr[loop_componentWrapperId].possiblyReRender(globalStateObj);
	}

	this._isDigestCycleRunning = false;

	// Startup the next Digest Cycle with a little breather.
	if(this._digestCycleRequestQueue){

		this._digestCycleRequestQueue--;

		var scopeThis = this;
		setTimeout(function(){
			scopeThis.runDigestCycle();
		}, 50);
	}
};

// This will return an array of objects with a shape of {nodeDepth:1, componentElemId:'elementIdOfComponentInstance'} and the array will be sorted with lowest depths first (closest to the root).
ComponentCollection.prototype._getComponentNodeDepths = function () {

	if(!document.body)
		throw new Error("Error in method _getComponentNodeDepths. The document.body tag can't be null at the time this method is called.");

	var elemObjArr = [];

	recurseDocumentStructure(document.body, 0);

	elemObjArr.sort(function(a, b){
		return a.nodeDepth - b.nodeDepth;
	});

	return elemObjArr;

	function recurseDocumentStructure(currentParent, currentDepthCounter){

		currentDepthCounter++;

		var childNodesArr = currentParent.children;

		for(var i=0; i<childNodesArr.length; i++){

			var loop_childNode = childNodesArr[i];

			// All browsers set the tagName in upper-case, regardless of the case in the source HTML document.
			// However a popular non-open browser is showing "svg" as lowercase.
			var upperCaseTagName = (loop_childNode.tagName + "").toUpperCase();

			if(["SCRIPT", "SVG"].indexOf(upperCaseTagName) > -1)
				continue;

			if(loop_childNode.tagName === "COMPONENTWRAPPER"){

				if(!loop_childNode.hasAttributes() || !loop_childNode.getAttribute("id"))
					throw new Error("Found a componentWrapper tag without an ID attribute.");

				var componentWrapperId = loop_childNode.getAttribute("id");

				elemObjArr.push({'nodeDepth': currentDepthCounter, 'componentElemId': componentWrapperId});
			}

			recurseDocumentStructure(loop_childNode, currentDepthCounter);
		}
	}
};

ComponentCollection.prototype.addComponentInstance = function (elementIdOfComponentInstance, componentInstanceObj) {

	HIPI.framework.Utilities.ensureObjectOfClassType(componentInstanceObj, "ComponentInstance");
	HIPI.framework.Utilities.ensureTypeString(elementIdOfComponentInstance);

	if(!elementIdOfComponentInstance.match(/^\w+$/))
		throw new Error("Error in method ComponentCollection.addComponentInstance. The given ElementId appears to be invalid: " + elementIdOfComponentInstance);

	if(this._componentInstancesArr[elementIdOfComponentInstance])
		throw new Error("Error in method ComponentCollection.addComponentInstance. The given ElementId has already been added: " + elementIdOfComponentInstance);

	this._componentInstancesArr[elementIdOfComponentInstance] = componentInstanceObj;
};

ComponentCollection.prototype.addComponent = function (componentObj) {

	HIPI.framework.Utilities.ensureObjectOfClassType(componentObj, "Component");

	var htmlSelectorOfComponentToBeAdded = componentObj.getHtmlElementSelector();

	var existingSelectorNamesArr = this.getAllComponentHtmlElementNames();

	if(existingSelectorNamesArr.indexOf(htmlSelectorOfComponentToBeAdded) > -1)
		throw new Error("Error in ComponentCollection.addComponent. The Component being added already exists within the collection: " + htmlSelectorOfComponentToBeAdded);

	if(!componentObj.getHtmlGenerator())
		throw new Error("Error in ComponentCollection.addComponent. The Component being added does not have an HTML generator function defined: " + htmlSelectorOfComponentToBeAdded);

	this._componentObjArr.push(componentObj);
};

ComponentCollection.prototype.getAllComponentHtmlElementNames = function () {

	var retArr = [];

	for(var i=0; i<this._componentObjArr.length; i++)
		retArr.push(this._componentObjArr[i].getHtmlElementSelector());

	return retArr;
};

ComponentCollection.prototype.getComponentObjectByHtmlSelector = function (htmlSelectorStr) {

	HIPI.framework.Utilities.ensureTypeString(htmlSelectorStr);

	for(var i=0; i<this._componentObjArr.length; i++){
		if(this._componentObjArr[i].getHtmlElementSelector() === htmlSelectorStr)
			return this._componentObjArr[i];
	}

	throw new Error("Error in method ComponentCollection.getComponentObjectByHtmlSelector. The component name could not be found within the collection: " + htmlSelectorStr);
};

// The object returned from this method, as well as the component reducers, is likely to point to the same object which is given (but not necessarily).
// The state object is not copied between reducers for performance reasons. 
ComponentCollection.prototype.runComponentReducers = function (stateObj, actionObj) {

	HIPI.framework.Utilities.ensureTypeObject(stateObj);
	HIPI.framework.Utilities.ensureTypeObject(actionObj);

	for(var i=0; i<this._componentObjArr.length; i++){

		if(this._componentObjArr[i].getReducer())
			stateObj = this._componentObjArr[i].getReducer()(stateObj, actionObj);
	}

	return stateObj;
};

ComponentCollection.prototype.runComponentStateCleaners = function (stateObj) {

	HIPI.framework.Utilities.ensureTypeObject(stateObj);

	var stateCopyObj = stateObj;

	for(var i=0; i<this._componentObjArr.length; i++){

		if(this._componentObjArr[i].getStateCleaner()){

			var loop_StateObj = this._componentObjArr[i].getStateCleaner()(HIPI.framework.Utilities.copyObject(stateCopyObj));

			if(JSON.stringify(loop_StateObj) !== JSON.stringify(stateCopyObj))
				console.log("The <"+this._componentObjArr[i].getHtmlElementSelector()+"> component state cleaner modified the global state.");

			stateCopyObj = loop_StateObj;
		}
	}

	return HIPI.framework.Utilities.copyObject(stateCopyObj);
};

ComponentCollection.prototype.runDomBindRoutinesIfNeeded = function () {

	// Run the DOM Updated callbacks in hierarchical order.
	var componentWrapperDepthsArr = this._getComponentNodeDepths();

	for(var i=0; i<componentWrapperDepthsArr.length; i++){

		var loop_componentWrapperId = componentWrapperDepthsArr[i].componentElemId;

		if(!this._componentInstancesArr[loop_componentWrapperId])
			throw new Error("Error in method runDomBindRoutinesIfNeeded. Unable to correlate the Component Wrapper found in the DOM with an instance in the collection for Element Id: " + loop_componentWrapperId);

		this._componentInstancesArr[loop_componentWrapperId].possiblyRunDomBindFunction();
	}
};
