"use strict";

// Every time a Component gets instantiated this constructor will create a unique ElementId to wrap the generated HTML within.
// Whenever a Component Property changes it requires a complete new Component Instance.
// However, if the State of the application changes the Component instances will figure out if they should re-render themselves or not (for performance).
// If the State changes and requires re-render this is accomplished internally, without modifying the wrapper.
function ComponentInstance(componentObj) {

	HIPI.framework.Utilities.ensureObjectOfClassType(componentObj, "Component");

	this._componentObj = componentObj;

	this._lastStateSliceObj = null;
	this._lastComponentPropertiesGenerated = null;

	// When this Component instance is asked to generate HTML it will create a unique ID to surround the generated HTML.
	this._elementIdOfWrapper = "CmpntId_" + this._componentObj.getHtmlElementSelector() + "_" + Date.now() + "_" + (Math.ceil(Math.random() * 10000000000));

	// With this approach the Component Collection will know of every instance created and it will now if the Component has been detached because the ElementID would no longer exist within the DOM.
	HIPI.framework.ComponentCollection.addComponentInstance(this._elementIdOfWrapper, this);

	this._hasDomBindFunctionRunYet = false;
};

// Pass in the state object by reference.
// The Global State should not change while the State Extractors are running across the ComponentCollection (they are not reducers).
// This way the same exact store object can be used throughout the digest cycle... running copyObject is very expensive on a large database.
// If any of the Component State extractors mess up the given State Object it will only affect the display/rendering, the corruption won't polute the Global State.
ComponentInstance.prototype.possiblyReRender = function (globalStateObjReference) {

	if(!this._lastComponentPropertiesGenerated)
		throw new Error("Error in method ComponentInstance.possiblyReRender. This method cannot be called before getComponentInstanceHtml() because the component properties have to be set.");

	var currentStateSlice = null;
	if(this._componentObj.getStateExtractor())
		currentStateSlice = this._componentObj.getStateExtractor()(this._lastComponentPropertiesGenerated, globalStateObjReference);

	// If both values are NULL they cannot be checked for equality using the Utilities.areObjectsEqual() method.
	if(!this._lastStateSliceObj && !currentStateSlice)
		return;

	// Check to make sure that one or the other isn't NULL before trying to compare the objects.
	if(HIPI.framework.Utilities.isTypeObject(this._lastStateSliceObj) && HIPI.framework.Utilities.isTypeObject(currentStateSlice)){
		if(HIPI.framework.Utilities.areObjectsEqual(this._lastStateSliceObj, currentStateSlice))
			return;
	}

	this._forceRender(HIPI.framework.Utilities.copyObject(currentStateSlice));
};

ComponentInstance.prototype.possiblyRunDomBindFunction = function () {

	if(this._hasDomBindFunctionRunYet)
		return;

	if(!this.isComponentInDOM())
		return;

	if(this._componentObj.getDomBindRoutine()){

		if(!this._lastComponentPropertiesGenerated)
			throw new Error("Error in method ComponentInstance.possiblyRunDomBindFunction. This method cannot be called before getComponentInstanceHtml() because the component properties have to be set.");

		this._hasDomBindFunctionRunYet = true;

		this._componentObj.getDomBindRoutine()(this._elementIdOfWrapper, this._lastComponentPropertiesGenerated, this._lastStateSliceObj);
	}
};

ComponentInstance.prototype.isComponentInDOM = function () {

	return document.getElementById(this._elementIdOfWrapper) ? true : false;
};

ComponentInstance.prototype.getHtmlElementSelector = function () {

	return this._componentObj.getHtmlElementSelector();
};

ComponentInstance.prototype.getPropertyNames = function () {

	return this._componentObj.getPropertyNames();
};

ComponentInstance.prototype.getElementIdOfComponentWrapper = function () {

	return this._elementIdOfWrapper;
};

// This will re-render the HTML source for this component instance within the wrapper.
ComponentInstance.prototype._forceRender = function (stateSlicesObj) {

	HIPI.framework.Utilities.ensureTypeObject(stateSlicesObj, true);

	if(!this.isComponentInDOM())
		throw new Error("Error in method ComponentInstance._forceRender. The Wrapper does not exist: " + this._elementIdOfWrapper);

	if(!this._lastComponentPropertiesGenerated)
		throw new Error("Error in method ComponentInstance._forceRender. This method cannot be called before getComponentInstanceHtml() because the component properties have to be set.");

	console.log("Updated HTML within Component wrapper:" + this._elementIdOfWrapper);

	this._lastStateSliceObj = HIPI.framework.Utilities.copyObject(stateSlicesObj);

	document.getElementById(this._elementIdOfWrapper).innerHTML = HIPI.framework.View.renderHtml(this._componentObj.generateHtml(this._elementIdOfWrapper, this._lastComponentPropertiesGenerated, this._lastStateSliceObj));

	// Running _forceRender should always execute the DOM update callback.
	this._hasDomBindFunctionRunYet = false;

	// It's possible that this Component has embedded another Component within its HTML which is why the DOM binding function on the collection needs to run versus on this instance alone.
	HIPI.framework.ComponentCollection.runDomBindRoutinesIfNeeded();
};

// This method expects an object literal with key/value pairs.
// If this component has attributes defined which are not found in the supplied object (or visa versa) this method will throw an error.
ComponentInstance.prototype.getComponentInstanceHtml = function (componentPropertiesForInstanceObj) {

	HIPI.framework.Utilities.ensureTypeObject(componentPropertiesForInstanceObj, true);

	if(componentPropertiesForInstanceObj)
		this._lastComponentPropertiesGenerated = HIPI.framework.Utilities.copyObject(componentPropertiesForInstanceObj);
	else
		this._lastComponentPropertiesGenerated = {};  // So that this variable will coerce to TRUE, indicating that properties have been set for the instance.

	if(this._componentObj.getStateExtractor())
		this._lastStateSliceObj = HIPI.framework.Utilities.copyObject(this._componentObj.getStateExtractor()(this._lastComponentPropertiesGenerated, HIPI.framework.AppState.getStoreObj()));

	return "<componentWrapper id='" + this._elementIdOfWrapper + "'>" + this._componentObj.generateHtml(this._elementIdOfWrapper, this._lastComponentPropertiesGenerated, this._lastStateSliceObj) + "</componentWrapper>";
};
