"use strict";

var View = {};

View._storeChangedEventSubsciption = null;

// The purpose of calling this method is to convert any <component></component> declarations found within the sourceHTML into HTML itself.
View.renderHtml = function (sourceHtml) {

	HIPI.framework.Utilities.ensureTypeString(sourceHtml);

	var componentSelectorsFoundInHtmlArr = View.getComponentSelectorsFoundInHtml(sourceHtml);

	// If there are no more Components found within the HTML source then this method can return.
	if(!componentSelectorsFoundInHtmlArr.length)
		return sourceHtml;

	// Otherwise pop the first Component selector found and convert it into the Component source.
	// Don't worry about the any of the other Component selectors found because this method is recursive.
	var thisComponentSelector = componentSelectorsFoundInHtmlArr.shift();

	var componentDeclarationStr = View.extractFirstComponentDeclaration(sourceHtml, thisComponentSelector);
	var attributeNameValuePairsObj = View.extractAttributeNameValuePairsFromComponentDeclaration(componentDeclarationStr);

	var componentObj = HIPI.framework.ComponentCollection.getComponentObjectByHtmlSelector(thisComponentSelector);

	// Now create an instance of the Component which will be able to listen for State changes and possibly update itself in response.
	var componentInstanceObj = new HIPI.framework.ComponentInstance(componentObj);

	var actionFiredWhileGettingComponentInstanceHtml = false;

	// Don't keep subscribing to the same event every time that View.renderHtml is called.
	if(!View._storeChangedEventSubsciption){

		View._storeChangedEventSubsciption = function(){
			actionFiredWhileGettingComponentInstanceHtml = true;
		};

		HIPI.framework.AppState.subscribeToStoreChangedEvents(View._storeChangedEventSubsciption, null, this);
	}

	// Sometimes a Component may try to set a default value on the Global State object by firing an action from within the Component.addStateExtractor() callback.
	// Without this "state change" detection loop it can lead to bugs which are very difficult to track down.
	// If a Component doesn't play nice and continues changing the State every single time getComponentInstanceHtml() is called then this method will alert developers to an infinite loop.
	var stateChangedWhileRenderingCounter = 0;
	while(++stateChangedWhileRenderingCounter){

		if(stateChangedWhileRenderingCounter > 100)
			throw new Error("An infinite loop has been detected within View.renderHtml. Every time this Component Instance generates HTML it continues to change the state. Element Selector: " + componentInstanceObj.getHtmlElementSelector());

		actionFiredWhileGettingComponentInstanceHtml = false;

		var componentHtml = componentInstanceObj.getComponentInstanceHtml(attributeNameValuePairsObj);

		if(!actionFiredWhileGettingComponentInstanceHtml)
			break;
		else
			console.log("Detected a State Change while calling upon componentInstanceObj.getComponentInstanceHtml for: " + componentInstanceObj.getHtmlElementSelector() + ": Current state change counter: " + stateChangedWhileRenderingCounter);
	}

	// The function is needed in the replacement argument to stop wierdness from occuring if there are dollar signs "$" in the replacement string (which could occur from a user-entered dialog message).
	sourceHtml = sourceHtml.replace(componentDeclarationStr, function(){ return ("<!-- Replacing component declaration with generated HTML for selector: " + thisComponentSelector + " \n -->\n" + componentHtml + "\n<!-- -------- End Component: " + thisComponentSelector + " ------------- -->")});

	// If there are still <components> within this View's source HTML after this last component was substituted then use recursion until there are no more remaining.
	var existingComponentsInViewArr = View.getComponentSelectorsFoundInHtml(sourceHtml);

	if(existingComponentsInViewArr.length)
		return View.renderHtml(sourceHtml);
	else
		return sourceHtml;
};

// Pass in a Component declaration, nothing more nothing less, or this method will throw an error.  Ex: "<myTabs selectedTab='me'></myTabs>".
// This will return an object literal representing the N/V pairs taken from HTML attributes.
// Returns NULL if there aren't any attributes found in the declaration.
View.extractAttributeNameValuePairsFromComponentDeclaration = function(componentDeclarationStr){

	HIPI.framework.Utilities.ensureTypeString(componentDeclarationStr);

	if(!componentDeclarationStr.match(/^<\w+/) || !componentDeclarationStr.match(/<\/\w+>$/))
		throw new Error("The given string to View.extractAttributeNameValuePairsFromComponentDeclaration doesn't appear to be a valid component declaration: " + componentDeclarationStr);

	// Get the opening tag by itself.
	var openingTagMatches = componentDeclarationStr.match(/^(<\w+[^>]*>)/);
	if(!openingTagMatches || openingTagMatches.length < 2)
		throw new Error("Cannot extract the opening tag in method View.extractAttributeNameValuePairsFromComponentDeclaration: "+ componentDeclarationStr);

	var openingTagStr = openingTagMatches[1];

	// Clean up the ends so that only a string of attributes remain.
	var attributeStr = openingTagStr.replace(/^<\w+\s*/, '').replace(/>$/, '');

	if(!attributeStr)
		return null;

	// Now extract all of the attribute names.
	var attributeNamesArr = [];
	var loopMatches;
	var loopRe = /(\w+)\s*=/g;

	while (loopMatches = loopRe.exec(attributeStr)) {

		if(loopMatches && loopMatches.length > 1)
			attributeNamesArr.push(loopMatches[1]);
	}

	if(!attributeNamesArr.length)
		throw new Error("Cannot extract any Attribute names from attribute string: " + attributeStr);

	// Now loop through all of the attribute names and extract the value for each one.
	var returnObj = {};

	for(var i=0; i<attributeNamesArr.length; i++){

		var loopAttrName = attributeNamesArr[i];

		// This RegEx extracts the value of the Attribute which may be surrounded in either single or double quotes.
		// The back reference \\1 is used to identify the second/closing quotation.
		// The parenthetical matching is used to extract the value out of the 2nd group... (.*?) ... which is a non-greedy way of matching any string of characters.
		var attributeValueRegex = new RegExp(loopAttrName + "\s*=\s*(['\"])(.*?)\\1");
		var attributeValueMatches = attributeStr.match(attributeValueRegex);

		if(!attributeValueMatches || attributeValueMatches.length < 3)
			throw new Error("Error in method View.extractAttributeNameValuePairsFromComponentDeclaration. Unable to extract the value for Attribute: " + loopAttrName + " within the Component Declaration: " + componentDeclarationStr);

		returnObj[loopAttrName] = attributeValueMatches[2];
	}

	if(HIPI.framework.Utilities.isObjectEmpty(returnObj))
		throw new Error("Error in method View.extractAttributeNameValuePairsFromComponentDeclaration. The return object should never be empty because the function should have already returned NULL.");

	return returnObj;
};

// Given a selector (such as "main") this method will extract the Component declaration from the HTML source and return something like "<main attribute='value'>Possible data in the future framework.</main>".
View.extractFirstComponentDeclaration = function(htmlStr, componentSelector){

	HIPI.framework.Utilities.ensureTypeString(htmlStr);
	HIPI.framework.Utilities.ensureTypeString(componentSelector);

	htmlStr = HIPI.framework.Utilities.removeCommentsFromHtml(htmlStr);

	var componentDeclarationRegex = new RegExp('(<' + componentSelector + '[^>]*>[^<]*</' + componentSelector + '>)');
	var matchesArr = htmlStr.match(componentDeclarationRegex);

	if(!matchesArr || matchesArr.length < 2)
		throw new Error("Error in method extractFirstComponentDeclaration. The componentSelector was not found inside of the HTML source: " + componentSelector);

	return matchesArr[1];
};

// Returns an array of strings representing the Component Element Names found within the given HTML.
View.getComponentSelectorsFoundInHtml = function(htmlStr){

	HIPI.framework.Utilities.ensureTypeString(htmlStr);

	htmlStr = HIPI.framework.Utilities.removeCommentsFromHtml(htmlStr);

	var allComponentSelectorsArr = HIPI.framework.ComponentCollection.getAllComponentHtmlElementNames();

	var retArr = [];

	for(var i=0; i<allComponentSelectorsArr.length; i++){

		var loop_ComponentSelector = allComponentSelectorsArr[i];

		var regExOpeningTag = new RegExp(('<' + loop_ComponentSelector + "\\b"));
		var regExClosingTag = new RegExp(('</' + loop_ComponentSelector + ">"));

		if(htmlStr.match(regExOpeningTag)){

			if(!htmlStr.match(regExClosingTag))
				throw new Error("Error in method View.getComponentSelectorsFoundInHtml. An opening tag was found without a closing tag: " + loop_ComponentSelector);

			retArr.push(loop_ComponentSelector);
		}
	}

	return retArr;
};
