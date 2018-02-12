"use strict";

// A class to assist with storing/firing multiple function calls (with zero or more parameters) within the scope of a particular object.
function Events(){

	this.onEventFuncs = new Array();
	this.onEventArgs = new Array();
	this.onEventObjs = new Array();
}

// For example: This event subscription would fire the equivalent of ... function alert("hello") 
//    eventObj.addSubscription(alert, ["Hello"], window);
Events.prototype.addSubscription = function(functionReference, functionArgumentsArr, objectRefForEvent){

	HIPI.framework.Utilities.ensureTypeFunction(functionReference);
	HIPI.framework.Utilities.ensureTypeArray(functionArgumentsArr, true);
	HIPI.framework.Utilities.ensureTypeObject(objectRefForEvent, true);

	if(!functionArgumentsArr)
		functionArgumentsArr = new Array();

	this.onEventFuncs.push(functionReference);
	this.onEventArgs.push(functionArgumentsArr);
	this.onEventObjs.push(objectRefForEvent);
};

Events.prototype.clearEvents = function(){

	this.onEventFuncs = new Array();
	this.onEventArgs = new Array();
	this.onEventObjs = new Array();
};

// If an array is given to the fire() method then they will be concatenated on top (to the right) of whatever functional arguments were provided to the subscription.
Events.prototype.fire = function(additionalArguments){

	HIPI.framework.Utilities.ensureTypeArray(additionalArguments, true);

	for(var eventCounter = 0; eventCounter < this.onEventFuncs.length; eventCounter++){

		var eventFunctionArguments = this.onEventArgs[eventCounter];

		if(additionalArguments)
			eventFunctionArguments = eventFunctionArguments.concat(additionalArguments);

		this.onEventFuncs[eventCounter].apply( this.onEventObjs[eventCounter], eventFunctionArguments);
	}
};
