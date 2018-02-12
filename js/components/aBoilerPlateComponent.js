"use strict";

// The postInit function is globally defined on the HTML/root.
// It is used to queue up a bunch of initialization scripts that are to be executed after all dependencies have loaded.
postInit(function(){

	// Don't forget to include the path to this <script> within the HTML source or else the component will silently fail to render.
	var componentObj = new HIPI.framework.Component();

	// REQUIRED
	// While HTML selectors traditionally use dashes and case-insensitive strings, this framework uses camel-case to help distinguish JavaScript components from HTML elements.
	componentObj.defineHtmlElementSelector("aBoilerPlateComponent");

	// OPTIONAL
	// A limitless number of custom properties can be defined on a component.
	// The property values can only be represented as strings and should be encoded as HTML.
	// EX: <aBoilerPlateComponent customProp="The property&#x27;s value."></aBoilerPlateComponent>
	componentObj.defineComponentPropName("customProp");

	// REQUIRED
	// This callback should simply return an HTML string for the component instance.
	// Element ID's tagged on nested HTML elements must be unique to the component instance in order to maintain encapsulation (which will allow multiple components to be instantiated on a page.) 
	// Since HTML Generators are shared among all instances the "elementIdOfComponentInstanceWrapper" should be concatenated with the custom identifiers on Element ID's.
	// Notice how the DOM Binding routine links up with the instance element ID's by means of the "elementIdOfComponentInstanceWrapper".
	// Any <otherCustomComponents></otherCustomComponents> included in the return string will be seamlessly instantiated and replaced (possibly recursively) in the following return string before it's inserted within the DOM. 
	componentObj.addHtmlGenerator(function(elementIdOfComponentInstanceWrapper, componentPropertiesObj, stateSlicesObj){

		var retHtml = "<h1>The custom property is: " + componentPropertiesObj["customProp"] + "</h1>" +
						"<button id='boiler-plate-btn"+elementIdOfComponentInstanceWrapper+"'>Click Me</button>";

		return retHtml;
	});

	// OPTIONAL
	// This callback will run once, shortly after the HTML Generator string has been inserted through innerHTML.
	componentObj.addDomBindRoutine(function(elementIdOfComponentInstanceWrapper, componentPropertiesObj, stateSlicesObj){

		document.getElementById("boiler-plate-btn"+elementIdOfComponentInstanceWrapper).addEventListener("click", function(){

			alert("I was clicked.");

			// HIPI.state.ActionMethods.innokeSomeActionMethodToChangeTheApplicationState(componentPropertiesObj.customProp, "A value");

			return false;
		});
	});

	// OPTIONAL
	// Other JavaScript frameworks consider this to represent the "scope".
	// Developers are expected to extract minimal data from the global state object within this callback.
	// The returned object is then passed to other callbacks such as addHtmlGenerator() and addDomBindRoutine() in the form of a "scope container" (named "stateSlicedObj" in this boiler plate example).
	// Developers can return anything they want from this callback, provided that it has a type of "object".
	// It is even possible to return the entire globalStateObj but that is not recommended because it would likely lead to poor performance (due to frequent repaint operations).
	// Whenever the global state is changed the stateExtractor callbacks are invoked for each instance of every registered component in the application (unless an instance has been removed from the DOM).
	// The return objects from each instance (i.e. scope container or stateSlicesObj) are compared against the previous on-state-changed cycle in order to determine if the HTML Generator should be invoked (considered a repaint operation for the Component).
	// While there is only one State Extractor function defined, regardless of the number of instances, the return object can be conditionally defined according to its Component Properties.
	componentObj.addStateExtractor(function(componentPropertiesObj, globalStateObj){

		var retObj = {};

		retObj.somePropertyExtractedFromTheGlobalState = globalStateObj.xyz;

		return retObj;
	});

	// OPTIONAL
	// The State Cleaner offers a way to undo any changes made to the global state by a reducer.
	// This application runs all of its State Cleaner before persisting the State Object as JSON to disk.
	componentObj.addStateCleaner(function(globalStateObj){

		HIPI.framework.Utilities.ensureTypeObject(globalStateObj);

		return globalStateObj;
	});

	// OPTIONAL
	// Learn about the "Flux Architecture" to understand how reducers work and why they are widely considered important in modern web applications.
	// Rather than having one global reducer, this framework breaks up the responsibilities of "global state mutation" across multiple reducers allowing each component to manage changes in close proximity.
	// The Flux Architecture requires copies of the global state to be made each time a change is made, however it is unnecessary to make a copy of the "stateObj" in a reducer callback.
	// Even through objects are passed by reference in JavaScript, this framework ensures that changes made to the "stateObj" are protected from so-called "side-effects" because a copies of the state object are always created before the reducers are invoked.
	componentObj.addReducer(function(stateObj, actionObj){

		HIPI.framework.Utilities.ensureTypeObject(stateObj);
		HIPI.framework.Utilities.ensureValidActionObject(actionObj);

		switch(actionObj.type){

			case HIPI.state.ActionNames.SOME_ACTION_NAME :

				stateObj.someModificationToTheGlobalState = "... are made here.";

				break;
		}

		return stateObj;
	});

	HIPI.framework.ComponentCollection.addComponent(componentObj);
});
