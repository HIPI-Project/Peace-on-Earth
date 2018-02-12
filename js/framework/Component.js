"use strict";

// Every Component must be associated with an HTML element (ex: <customComponentName></customComponentName>)
function Component() {

	this._elementSelector = "";
	this._propNamesArr = [];
	this._htmlGeneratorFunction;
	this._stateExtractorFunction;
	this._reducerFunction;
	this._stateCleanerFunction;
	this._domBindFunction;
};

Component.prototype.defineHtmlElementSelector = function (elementNameStr) {

	if(typeof elementNameStr !== "string" || !elementNameStr.match(/^\w+$/))
		throw new TypeError("Error in method defineHtmlElementSelector. The given argument doesn't appear to be a valid HTML element selector: " + elementNameStr);

	this._elementSelector = elementNameStr;
};

Component.prototype.getHtmlElementSelector = function () {

	if(!this._elementSelector)
		throw new Error("Error in method getHtmlElementSelector. The selector hasn't been defined yet.");

	return this._elementSelector;
};

Component.prototype.defineComponentPropName = function (propNameStr) {

	if(typeof propNameStr !== "string" || !propNameStr.match(/^\w+$/))
		throw new TypeError("Error in method defineComponentPropName. The given argument doesn't appear to be a valid HTML attribute name: " + propNameStr);

	this._propNamesArr.push(propNameStr);
};

Component.prototype.getPropertyNames = function () {

	return this._propNamesArr;
};

// The function passed into this method should generate HTML source code and return it as a string.
// Any attribute names discovered in the source with double-curly-brackets will be replaced by the attribute value.
// EX:
// function(attributesObj){
//    return "<div>The component has been turned into HTML and any {{attribute}} names will be {{substituted}} when the generateHtml() method is called.</div>";	
// } 
Component.prototype.addHtmlGenerator = function (generateHtmlFunction) {

	HIPI.framework.Utilities.ensureTypeFunction(generateHtmlFunction);

	this._htmlGeneratorFunction = generateHtmlFunction;
};

Component.prototype.getHtmlGenerator = function () {
	return this._htmlGeneratorFunction;
};

// The Component may optionally define a function which runs only runs ONCE whenever the Component HTML is inserted within the DOM.
// This can be useful for binding to DOM events.
Component.prototype.addDomBindRoutine = function (domUpdateFunction) {

	HIPI.framework.Utilities.ensureTypeFunction(domUpdateFunction);

	this._domBindFunction = domUpdateFunction;
};

Component.prototype.getDomBindRoutine = function () {
	return this._domBindFunction;
};

// The function passed into this method should expect an object literal of Component Properties (just like addHtmlGenerator).
// When the callback is invoked it will be passed a copy of the global AppState and also an object containing the Component Properties.
// It's responsibility is to extract bare minimum of properties from the application State and return them within an object literal.
// With this approach it becomes possible to avoid updating the Component HTML if the "interesting parts of the state" haven't changed since the last digest cycle.
Component.prototype.addStateExtractor = function (stateExtractorFunction) {

	HIPI.framework.Utilities.ensureTypeFunction(stateExtractorFunction);

	this._stateExtractorFunction = stateExtractorFunction;
};

Component.prototype.getStateExtractor = function () {
	return this._stateExtractorFunction;
};

// The function passed into this method should be "pure" without any side-effects.
// When this function is invoked it will be passed a State & Action object... it should return a copy of the state.
Component.prototype.addReducer = function (reducerFunction) {

	HIPI.framework.Utilities.ensureTypeFunction(reducerFunction);

	this._reducerFunction = reducerFunction;
};

Component.prototype.getReducer = function () {
	return this._reducerFunction;
};

// The function passed into this method is almost inverse to a Reducer and similarly it should be "pure" without any side-effects.
// The given function will be invoked with a State Object and it expects to get a copy of that object with any properties removed.
// The objective is to give the component a chance to remove any data from the Store that should not be saved to disk and shared with others.
Component.prototype.addStateCleaner = function (stateCleanerFunction) {

	HIPI.framework.Utilities.ensureTypeFunction(stateCleanerFunction);

	this._stateCleanerFunction = stateCleanerFunction;
};

Component.prototype.getStateCleaner = function () {
	return this._stateCleanerFunction;
};

// If this component has attributes defined which are not found in the supplied object (or visa versa) this method will throw an error.
// This method doesn't have access to the global State.
// The component should extract the minimum set of properties out of the global state needed to generate the HTML using the getStateExtractor() callback.
// The return object from the Component's getStateExtractor is what gets passed as the second argument into this method.
// What is the purpose of the roundabout? Why can't the callback from the _htmlGeneratorFunction() just access the global State object directly?
// Because with this approach it's possible to detect if a Component needs to re-render itself in response to changes on the global state.  
Component.prototype.generateHtml = function (elementIdOfComponentInstanceWrapper, componentPropertiesObj, stateSlicesObj) {

	HIPI.framework.Utilities.ensureTypeString(elementIdOfComponentInstanceWrapper, false);
	HIPI.framework.Utilities.ensureTypeObject(componentPropertiesObj, true);
	HIPI.framework.Utilities.ensureTypeObject(stateSlicesObj, true);

	var allKeyNamesGivenArr = [];
	var key;

	if(componentPropertiesObj){

		for(key in componentPropertiesObj){

			if(this._propNamesArr.indexOf(key) === -1)
				throw new Error("Error in Component.generateHtml. One of the attributes passed to this method hasn't been defined on this component: " + key);

			allKeyNamesGivenArr.push(key);
		}
	}

	for(var i=0; i<this._propNamesArr.length; i++){

		if(allKeyNamesGivenArr.indexOf(this._propNamesArr[i]) === -1)
			throw new Error("One of the attributes defined on this Component does not exist within the attribute name/value pair object passed to Component.generateHtml: " + this._propNamesArr[i]);
	}

	// Invoke the callback provided by the component definition.
	var htmlStr = this._htmlGeneratorFunction(elementIdOfComponentInstanceWrapper, componentPropertiesObj, stateSlicesObj);

	if(typeof htmlStr !== "string")
		throw new TypeError("Error in method Component.generateHtml. The HTML Generator function must return a string.");

	for(var i=0; i<this._propNamesArr.length; i++){

		var loop_attributeName = this._propNamesArr[i];
		var loop_attributeValue = componentPropertiesObj[loop_attributeName];

		if(typeof loop_attributeValue !== "string")
			throw new TypeError("Error in method Component.generateHtml. One of the given Attribute values is not of type string. Attribute Name: " + loop_attributeName);

		var searchAttributeRegex = new RegExp(('\\{\\{' + loop_attributeName + '\\}\\}'), 'g');

		// Stop dollar sign "$" madness in the replacment string using a function for the second argument.
		htmlStr = htmlStr.replace(searchAttributeRegex, function(){ return loop_attributeValue });
	}

	return htmlStr;
};
