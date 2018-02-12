"use strict";

var Utilities = {};

Utilities.removeCommentsFromHtml = function(htmlStr){

	Utilities.ensureTypeString(htmlStr);

	// The "?" makes the expression non-greedy.
	// The character class [\s\S] is kind of a JavaScript hack for matching across multiple lines.
	return htmlStr.replace(/<!--[\s\S]*?-->/g, '');
};

Utilities.escapeStringForRegularExpression = function(inputStr){

	Utilities.ensureTypeString(inputStr);

	return inputStr.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

Utilities.copyObject = function(objectToCopy){

	Utilities.ensureTypeObject(objectToCopy);

	return JSON.parse(JSON.stringify(objectToCopy));
};

Utilities.copyArray = function(arrayToCopy){

	Utilities.ensureTypeArray(arrayToCopy);

	return JSON.parse(JSON.stringify(arrayToCopy));
};

// This function expects object literals. Null is disallowed because of the JavaScript "typeof null === 'object'" bug or NULL values (since typeof NULL is considered an object in JavaScript).
Utilities.areObjectsEqual = function(obj1, obj2){

	Utilities.ensureTypeObject(obj1);
	Utilities.ensureTypeObject(obj2);

	if(obj1 === obj2)
		return true;

	if(JSON.stringify(obj1) === JSON.stringify(obj2))
		return true;

	return false;
};

Utilities.isObjectEmpty = function(objectToTest){

	Utilities.ensureTypeObject(objectToTest);

	for(var loop_prop in objectToTest) {
		if(objectToTest.hasOwnProperty(loop_prop))
			return false;
	}

	return JSON.stringify(objectToTest) === JSON.stringify({});
};

Utilities.isTypeObject = function(objectToTest){

	if(objectToTest === null || typeof objectToTest !== 'object')
		return false;

	return true;
};

Utilities.ensureTypeObject = function(objectToTest, isOptionalBool){

	if(isOptionalBool && (objectToTest === undefined || objectToTest === null))
		return;

	if(!Utilities.isTypeObject(objectToTest))
		throw new TypeError("The given argument is not an object in method ensureTypeObject.");
};

Utilities.ensureValidActionObject = function(actionObj){

	if(!Utilities.isTypeObject(actionObj))
		throw new TypeError("Error in ensureValidAction. The given actionObj is not of type object so it can't be a valid Action Object.");

	if(!actionObj.type || typeof actionObj.type !== "string")
		throw new TypeError("Error in ensureValidAction. The given actionObj does not have a .type property containing a non-empty string.");
};

Utilities.ensureTypeFunction = function(objectToTest, isOptionalBool){

	if(isOptionalBool && (objectToTest === undefined || objectToTest === null))
		return;

	if(!objectToTest || !objectToTest.constructor || !objectToTest.apply)
		throw new TypeError("The given argument is not a function in method ensureTypeFunction.");
};

Utilities.ensureTypeBoolean = function(objectToTest, isOptionalBool){

	if(isOptionalBool && objectToTest === undefined)
		return;

	if(typeof objectToTest !== "boolean")
		throw new TypeError("The given argument must be of type 'boolean': " + (typeof objectToTest));
};

Utilities.ensureTypeString = function(objectToTest, isOptionalBool){

	if(isOptionalBool && (objectToTest === undefined || objectToTest === null))
		return;

	if(typeof objectToTest !== "string")
		throw new TypeError("The given argument must be of type 'string': " + objectToTest);

};

Utilities.ensureTypeArray = function(objectToTest, isOptionalBool){

	if(isOptionalBool && (objectToTest === undefined || objectToTest === null))
		return;

	if(!Array.isArray(objectToTest))
		throw new TypeError("The given argument must be of type 'array': " + objectToTest);
};

Utilities.ensureIntegerPositiveOrZero = function(objectToTest, isOptionalBool){

	if(isOptionalBool && (objectToTest === undefined || objectToTest === null))
		return;

	if(!new String(objectToTest).match(/^\d+$/))
		throw new TypeError("The given argument does not have an integer pattern in method ensureIntegerPositiveOrZero: " + objectToTest);

	if(isNaN(objectToTest))
		throw new TypeError("The given argument is NAN in method ensureIntegerPositiveOrZero: " + objectToTest);
};

Utilities.ensureObjectOfClassType = function(objectToTest, className, isOptionalBool){

	if(isOptionalBool && (objectToTest === undefined || objectToTest === null))
		return;

	if(!objectToTest || !objectToTest.constructor || !objectToTest.constructor.name)
		throw new TypeError("Error in method ensureObjectOfClassType. The given object does not appear of be an instance of a constructor function while checking for className: " + className);

	if(objectToTest.constructor.name !== className)
		throw new TypeError("Error in method ensureObjectOfClassType. It does not match the className: " + className + ", it is an instance of: " + objectToTest.constructor.name);
};

Utilities.ensureUrl = function(objectToTest){

	Utilities.ensureTypeString(objectToTest);

	if(!objectToTest.match(/(\/?[\w-]+)(\/[\w-]+)*\/?|(((http|ftp|https):\/\/)?[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?)/i))
		throw new TypeError("Error in ensureUrl. The given string does not appear to be a URL: " + objectToTest);
};

Utilities.getAjax = function(url){

	Utilities.ensureUrl(url);

	return new Promise(function (resolve, reject) {

		var request = new XMLHttpRequest();

		request.onreadystatechange = function() {

			if(request.readyState === 4){

				if(request.status === 200)
					resolve(request.responseText);
				else
					reject('Unable to fulfill AJAX GET request: ' +  request.status + ' ' + request.statusText);
			}
		}

		request.open('GET', url);
		request.send(null);
	});
};

Utilities.postAjax = function(url, dataStr){

	Utilities.ensureUrl(url);
	Utilities.ensureTypeString(dataStr);

	return new Promise(function (resolve, reject) {

		var request = new XMLHttpRequest();

		request.onreadystatechange = function() {

			if(request.readyState === 4){

				if(request.status === 200)
					resolve(request.responseText);
				else
					reject('Unable to fulfill AJAX POST request: ' +  request.status + ' ' + request.statusText);
			}
		}

		request.open('POST', url);
		request.send(dataStr);
	});
};

Utilities.isUserNameValid = function(objectToTest){

	Utilities.ensureTypeString(objectToTest);

	if(objectToTest.match(/^\w{2,}$/))
		return true;
	else
		return false;
};

Utilities.ensureValidUserName = function(objectToTest){

	Utilities.ensureTypeString(objectToTest);

	if(!Utilities.isUserNameValid)
		throw new Error("Error in method Utilities.ensureValidUserName. The given string is not a valid user name: " + objectToTest);
};

Utilities.escapeHtml = function(unsafeText){

	Utilities.ensureTypeString(unsafeText);

	var htmlEntities = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#x27;',
		'/': '&#x2F;'
	};

	var htmlEscapeRegEx = /[&<>"'\/]/g;

	var htmlEncodedStr = unsafeText.replace(htmlEscapeRegEx, function(match) {
		return htmlEntities[match];
	});

	return htmlEncodedStr;
};

Utilities.ensureStringOfCommaSeparatedIntegers = function(objectToTest){

	if(typeof objectToTest !== "string")
		throw new TypeError("Error in method ensureStringOfCommaSeparatedIntegers. The given argument must be of type 'string': " + objectToTest);

	if(!objectToTest)
		return;

	var integerArr = objectToTest.split(',');

	for(var i=0; i<integerArr.length; i++){
		if(!integerArr[i].match(/^\d+$/))
			throw new Error("Error in method ensureStringOfCommaSeparatedIntegers. Element " + i + " is not an integer.");
	}
};

// Pass in a string such as "0,3,4" or "" and a second argument of (5) and and this method would return "0,3,4,5" or "5" respectively.
Utilities.addIntegerToEndOfCommaSeparatedChain = function(commaSeparatedIntegerStr, newInteger){

	Utilities.ensureStringOfCommaSeparatedIntegers(commaSeparatedIntegerStr);
	Utilities.ensureIntegerPositiveOrZero(newInteger);

	return commaSeparatedIntegerStr + (commaSeparatedIntegerStr ? "," : "") + newInteger;
};

Utilities.removeIntegerFromEndOfCommaSeparatedChain = function(commaSeparatedIntegerStr){

	Utilities.ensureStringOfCommaSeparatedIntegers(commaSeparatedIntegerStr);

	if(!commaSeparatedIntegerStr)
		throw new Error("Error in method Utilities.removeIntegerFromEndOfCommaSeparatedChain. The given argument cannot be an empty string because there is no element to be removed.");

	return commaSeparatedIntegerStr.replace(/,?\d+$/, '');
};

Utilities.getSelectedText = function(){

	var text = "";

	// This is the standard/modern method for retrieving selected text in the document.
	if (window.getSelection) 
		text = window.getSelection().toString();

	// Older non-open-source browsers must use "document.selection" to discover a selected text range. 
	// However, "createRange" is part of the "DOM Level 2" specification.
	else if (document.selection && document.selection.type != "Control")
		text = document.selection.createRange().text;

	return text;
};

Utilities.setCursorPosition = function(inputElement, cursorPosition){

	Utilities.ensureIntegerPositiveOrZero(cursorPosition);

	// The "createTextRange" property is only for older non-open-source browsers.
	if(inputElement.createTextRange) {

		var range = inputElement.createTextRange();

		range.move('character', cursorPosition);

		range.select();
	}
	else if(inputElement.selectionStart){

		inputElement.focus();

		inputElement.setSelectionRange(cursorPosition, cursorPosition);
	}
	else{
		throw new Error("Error Utilities.setCursorPosition. The given argument does not appear to be an HTML input element.", inputElement);
	}
};

// This method will return the carrot position on a TextArea or Input element.
// If the user has created a text-range then this method will return -1 which indicates that the user isn't entering text (with a blinking cursor), but rather has selected some.
Utilities.getCursorPosition = function(inputElement){

	// The "sectionStart" object is the preferred HTML5 implementation, the textRange conditional is a fall-back for older browsers.
	// First make sure that the input element has the focus.
	if ("selectionStart" in inputElement && document.activeElement === inputElement) {

		// Make sure that the user hasn't selected text, but has a blinking cursor.
		if(inputElement.selectionStart === inputElement.selectionEnd)
			return inputElement.selectionStart;
		else
			return -1;
	}
	else if (inputElement.createTextRange) {

		// This is part of the DOM Level 2 specification.
		var documentRangeObj = document.selection.createRange();

		// Make sure that the input element has the focus.
		if (documentRangeObj.parentElement() !== inputElement) 
			return -1;

		// This is specific to older non-open-source browsers.
		var inputTextRangeObj = inputElement.createTextRange();

		// The methods "getBookmark" and "moveToBookmark" are normally used to temporarily save/extract selected text and then later restore that selection. 
		// In this case they are being used to transfer the "document selection" onto the newly created "input selection".
		inputTextRangeObj.moveToBookmark(documentRangeObj.getBookmark());

		// This is a way of finding the character position of the "selection end".
		// For loops always contain 3 sections.
		//   1) Initialization - Start out from the start-of-string.
		//   2) Condition -      The "EndToStart" option compares the end of the TextRange object with the start of the SourceRange. 
		//                       It returns -1 if the TextRange object's end-point is to the left of the SourceRange's end-point.
		//                       If 1 is returned then it is to the right, and 0 means that the end-points are the same.
		//   3) Afterthought -  On each iteration of the loop, the "len" variable is increased while the TextRange contracts (from right-end to left) by 1 character.
		for (var len = 0; inputTextRangeObj.compareEndPoints("EndToStart", inputTextRangeObj) > 0; inputTextRangeObj.moveEnd("character", -1))
			len++;

		// The "StartToStart" option will transfer the "range of text" to the start of the SourceRange, but the range is likely not in the correct position.
		inputTextRangeObj.setEndPoint("StartToStart", inputElement.createTextRange());

		// Perform the same loop as above, but this time shift the range from left-to-right (maintaining the offset between start/end). 
		for (var positionObj = { start: 0, end: len }; inputTextRangeObj.compareEndPoints("EndToStart", inputTextRangeObj) > 0; inputTextRangeObj.moveEnd("character", -1)) {
			positionObj.start++;
			positionObj.end++;
		}

		// Make sure that the user hasn't selected a range of text, but rather has a blinking cursor within the input element.
		if(positionObj.start === positionObj.end)
			return positionObj.start;
		else
			return -1;
	}
	else{
		throw new Error("Error Utilities.getCursorPosition. The given argument does not appear to be an HTML input element.", inputElement);
	}
};

Utilities.trimText = function(textToTrim){

	Utilities.ensureTypeString(textToTrim);

	textToTrim = textToTrim.replace(/^\s*/, '');
	textToTrim = textToTrim.replace(/\s*$/, '');

	return textToTrim;
};

// This solves a problem of trying to split on an empty string which creates a 1-element-array rather than an empty array. 
// var x = "".split(",");  JSON.stringify(x) === '[""]' === true;
Utilities.getArrayOfIntegersFromCommaSeparatedChain = function(commaSeparatedIntegerStr){

	Utilities.ensureStringOfCommaSeparatedIntegers(commaSeparatedIntegerStr);

	if(!commaSeparatedIntegerStr)
		return [];
	else
		return commaSeparatedIntegerStr.split(",");
};

// Given a comma separated string such as "6,28,14,7" this method will return an array with elements ["6", "6,28", "6,28,14", "6,28,14,7"].
Utilities.getAncestorArrayFromCommaSeparatedIntegers = function(commaSeparatedIntegerStr){

	Utilities.ensureStringOfCommaSeparatedIntegers(commaSeparatedIntegerStr);

	var positionIntegersArr = Utilities.getArrayOfIntegersFromCommaSeparatedChain(commaSeparatedIntegerStr);

	var lastCommaSeparatedStr = "";
	var retArr = [];

	positionIntegersArr.forEach(function(loopPositionInt){

		lastCommaSeparatedStr = Utilities.addIntegerToEndOfCommaSeparatedChain(lastCommaSeparatedStr, loopPositionInt);

		retArr.push(lastCommaSeparatedStr);
	});

	return retArr;
};

// Given a string and a "maxStringLength" parameter, this method will chop off everything at the maxStringLength and beyond.
// Then it will continue stripping off characters from the end until a space is encountered.
// The "chop routine" will stop after the maxSpacesToLook limit is reached.
Utilities.truncateBackToFirstSpace = function(stringToTruncate, maxStringLength, maxSpacesToLook){

	Utilities.ensureTypeString(stringToTruncate);
	Utilities.ensureIntegerPositiveOrZero(maxStringLength);
	Utilities.ensureIntegerPositiveOrZero(maxSpacesToLook);

	stringToTruncate = stringToTruncate.substr(0, maxStringLength);

	var currentSpaceCounter = 0;

	while(currentSpaceCounter < maxSpacesToLook){

		currentSpaceCounter++;

		if(stringToTruncate.slice(-1) === " ")
			break;

		stringToTruncate = stringToTruncate.slice(0, -1);
	}

	return stringToTruncate;
};

// Escapes a given with HTML special characters and converts line breaks to <br> tags.
Utilities.htmlizeStringWithLineBreaks = function(stringToEscape){

	Utilities.ensureTypeString(stringToEscape);

	stringToEscape = Utilities.escapeHtml(stringToEscape);

	stringToEscape = stringToEscape.replace(/\n/g, "<br/>");

	return stringToEscape;
};

// This method starts from the HTML element reference and walks back up the hierarchy looking for an element which contains the given class name.
// Returns NULL if the class cannot be found, otherwise returns the target HTML element.
Utilities.getClosestHtmlElementWithClassName = function(startHtmlElement, className){

	Utilities.ensureTypeString(className);

	if(!startHtmlElement.parentNode)
		throw new Error("Error in Utilities.getClosestHtmlElementWithClassName. The given argument does not appear to be an HTML element.");

	while(true) {

		if(!startHtmlElement.parentNode)
			return null;

		var loopTagName = startHtmlElement.parentNode.tagName;

		if(loopTagName === "BODY")
			return null;

		var classNamesArr = (startHtmlElement.className + "").split(' ');

		if(classNamesArr.indexOf(className) > -1)
			return startHtmlElement;

		startHtmlElement = startHtmlElement.parentNode;
	}
};

// This method will return the "Events" object associated with the given unique ID.
// If an Events object is not found a new one will be created and added into global scope.
// This is one way to encapsulate events between separate components, if they can all agree upon a unique ID (maybe passed down through props).
Utilities.getEventsObjectFromGlobalScopeByUniqueId = function(eventsObjectIdentifier){

	Utilities.ensureTypeString(eventsObjectIdentifier);

	if(!eventsObjectIdentifier)
		throw new Error("Error in Utilities.getEventsObjectFromGlobalScopeByUniqueId. The eventsObjectIdentifier cannot be empty.");

	if(!window.globalEventsObj)
		window.globalEventsObj = {};

	if(!window.globalEventsObj[eventsObjectIdentifier])
		window.globalEventsObj[eventsObjectIdentifier] = new HIPI.framework.Events();

	return window.globalEventsObj[eventsObjectIdentifier];
};

var globalUniqueIdTracker = [];

// This method will always return a relatively unique number throughout the lifetime of the application.
Utilities.getUniqueNumber = function(){

	var retUniqueNumber = Math.round(Math.random() * Date.now());

	while(globalUniqueIdTracker.indexOf(retUniqueNumber) > -1)
		retUniqueNumber = Math.round(Math.random() * Date.now());

	return retUniqueNumber;
};

// Replace multiple spaces with just one because HTML conflates white-space.  
// This is important because contradictions highlight text-ranges and this is needed to normalize data between line-breaks and consecutive spaces..
Utilities.conflateHtmlWhitespace = function(textForHtml){

	Utilities.ensureTypeString(textForHtml);
	
	textForHtml = textForHtml.replace(/\r/g, '');
	textForHtml = textForHtml.replace(/ +\n/g, '\n');
	textForHtml = textForHtml.replace(/\n +/g, '\n');
	textForHtml = textForHtml.replace(/ +/g, ' ');

	return textForHtml;
};

Utilities.debounce = function(fn, delay){

	var timer = null;
	
	return function(){
		
		var context = this, args = arguments;

		clearTimeout(timer);
		
		timer = setTimeout(function(){
			fn.apply(context, args);
		}, delay);
	};
}