"use strict";

// This is meant to be a globally-accessible object used throughout the lifetime of the application as a single source for module retrieval.
// The design can never be perfect which means that it can continue getting better.
// Everyone is encouraged to improve upon the application without using concepts such as moderation or ownership.
// Fortunately there is now a mechanism for unambiguously determining what "better software" means.
//
// CODER'S AXIOM: "Barring any approaches which contradict the objective, the smallest size post-compilation trumps any alternative."
//
// There are 2 subjective dependencies which tug the nearly infinitesimal boundary into opposite directions.
// 
//    A) The compiler can remain theoretical and anything is possible, provided that all participants agree. 
//       For example, it should be possible for a compiler to substitute any hard-coded string with a symbol referring to a record within a localization DB so that informative error messages do not contribute to the compiled size.
//    
//    B) The objective can be arbitrarily defined, provided that all participants agree.
//       For example, integrating informative error messages within the codebase might be a requirement.
//
// As the compiler becomes more sophisticated, and grows larger, the size of the codebase decreases (post-compilation).
// As the list of objectives grows larger :(i.e. Unit Testing):, the size of the codebase increases (post-compilation).  
//
// What are the objective(s)?  Those fall on the side of "righteous" which is why the HIPI itself is the place to discuss.

function AppContainer() {

	if (AppContainer._instanceAlreadyCreated) {
		if(console && console.warn)
			console.warn("Another instance of the AppContainer has been generated. There should only be 1 instantiated for the lifetime of the application.");
	}
	AppContainer._instanceAlreadyCreated = true;

	this.framework = {};
	this.state = {};
	this.lib = {};

	this.framework.AppState = new AppState();
	this.framework.ComponentCollection = new ComponentCollection();

	this.framework.View = View;
	this.framework.Events = Events;
	this.framework.Component = Component;
	this.framework.ComponentInstance = ComponentInstance;
	this.framework.Utilities = Utilities;
	this.framework.Constants = Constants;

	this.state.ActionNames = ActionNames;
	this.state.ActionObjects = ActionObjects;
	this.state.ActionMethods = ActionMethods;

	this.lib.Dialogs = Dialogs;
	this.lib.Contradictions = Contradictions;
	this.lib.General = General;
	this.lib.Contributions = Contributions;
	this.lib.MapMessage = MapMessage;
	this.lib.MapRowOrColumn = MapRowOrColumn;
	this.lib.Language = Language;
}
