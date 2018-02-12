"use strict";
postInit(function(){

	var componentObj = new HIPI.framework.Component();

	componentObj.defineHtmlElementSelector("autoComplete");
	componentObj.defineComponentPropName("elementIdOfInput");

	componentObj.addHtmlGenerator(function(elementIdOfComponentInstanceWrapper, componentPropertiesObj, stateSlicesObj){

		var retHtml = "<div class='auto-complete-container' id='auto-complete-container"+elementIdOfComponentInstanceWrapper+"'>" +
							"<div class='auto-complete-title'>Auto Completions Help Establish Valuable Interconnections</div>" +
							"<div id='auto-complete-results"+elementIdOfComponentInstanceWrapper+"'></div>" +
						"</div>";

		return retHtml;
	});

	componentObj.addDomBindRoutine(function(elementIdOfComponentInstanceWrapper, componentPropertiesObj, stateSlicesObj){

		if(!document.getElementById(componentPropertiesObj.elementIdOfInput))
			throw new Error("Error in <autoComplete> DOM Binding Routine. The component properties specify an Element ID which does not exist within the DOM: " + componentPropertiesObj.elementIdOfInput);

		var isAutoCompleteRoutineStillRunning = false;

		// There's a lag between when the CLICK event is captured on the auto-complete DIV and the blur event of the input element.
		var lastAutoCompleteDivClickTimestamp = 0;

		// When the focus leaves the textarea (not to the auto-complete DIV) then hide the auto-complete DIV.
		document.getElementById(componentPropertiesObj.elementIdOfInput).addEventListener("blur", function(){

			var blurTimestamp = Date.now();

			var blurThresholdMilliseconds = 500;

			setTimeout(function(){

				// If someone clicks on the auto-complete container (possibly multiple times) after the setTimeout has fired it would cause the summation to become negative, but still less than the threshold.
				// Otherwise, if the user clicks outside the auto-complete container and doesn't click back in, the summation would be approach zero but the sign is uncertain (depending on browser's bubble/capture event implementation).  
				if(Math.abs(blurTimestamp - lastAutoCompleteDivClickTimestamp) > blurThresholdMilliseconds)
					hideAutoCompleteDiv();

			}, blurThresholdMilliseconds);
		});

		document.getElementById("auto-complete-container" + elementIdOfComponentInstanceWrapper).addEventListener("click", function(){

			lastAutoCompleteDivClickTimestamp = Date.now();
		});

		// If the user click into a different cursor position then the old auto-complete list may no longer be valid.
		document.getElementById(componentPropertiesObj.elementIdOfInput).addEventListener("click", function(){

			hideAutoCompleteDiv();

			keyUpHandler();
		});

		document.getElementById(componentPropertiesObj.elementIdOfInput).addEventListener("keyup", HIPI.framework.Utilities.debounce(function(e){

			keyUpHandler();

		}, HIPI.framework.Constants.getMilliSecondDelayForKeyUpDebounce()));

		function keyUpHandler(){

			if(isAutoCompleteRoutineStillRunning){

				console.log("The auto-complete routine is still running after " + HIPI.framework.Constants.getMilliSecondDelayForKeyUpDebounce() + "ms.  It's time to consider indexing and/or other mechanisms for increasing performance.");

				return;
			}

			// Convert the textarea to lowercase so that it's normalized with the auto-complete strings.
			var textAreaStr = document.getElementById(componentPropertiesObj.elementIdOfInput).value.toLowerCase();

			var cursorPositionInTextArea = HIPI.framework.Utilities.getCursorPosition(document.getElementById(componentPropertiesObj.elementIdOfInput));

			// If the cursor position is -1 then the user doesn't have an active/blinking cursor within the text area.
			// If the the cursor is at the very start of the textarea (at position 0) then there is nothing to auto-complete.
			if(cursorPositionInTextArea <= 0){

				document.getElementById("auto-complete-container" + elementIdOfComponentInstanceWrapper).style.display = "none";

				return;
			}

			isAutoCompleteRoutineStillRunning = true;

			// Record any matched indexes out of the auto-complete array.
			var matchingCantArrayIndexesArr = [];

			// In parallel with any matches, store the character positions in the input area where substitution should occur.
			var matchingInputCharacterPositionStart = [];
			var matchingInputCharacterPositionEnd = [];

			stateSlicesObj.cantStrLowerCaseArr.forEach(function(loopCantStrLowerCase, loopCantIndex){

				// Start out by looking back one character in the textarea (from the cursor) and look for matches in the auto-complete array.
				// If a match is found then start looking backwards in the textarea to make sure that both sequences are aligned up to the auto-complete start-of-string.
				var lookBehindCursorCounter = 1;

				while(true){

					// Keep looping, looking back an additional character until reaching beginning of the textarea (if necessary).
					if(lookBehindCursorCounter > cursorPositionInTextArea)
						break;

					var textAreaReverseSubstring = getStringByCharacterCountBehindCursor(lookBehindCursorCounter);

					var loopIndexMatch = loopCantStrLowerCase.indexOf(textAreaReverseSubstring);

					// If the entire string is matched then there is no point in auto-completing the phrase.
					if(lookBehindCursorCounter === loopCantStrLowerCase.length)
						return;

					// Skip the forEach iteration once a mismatch occurs.
					if(loopIndexMatch === -1)
						return;

					// In this case, the string was taken back X characters behind the cursor and that fragment was completely found inside of the possible auto-complete, starting from the beginning.
					if(loopIndexMatch === 0){

						// Don't offer a match unless start of match occurs at a word boundary such as a space, newline, or start-of-textarea.
						var isCursorAtStartOfTextArea = false;
						var isPrecedingTextareaNewlineOrSpace = false;

						if(lookBehindCursorCounter === cursorPositionInTextArea){

							isCursorAtStartOfTextArea = true;
						}
						else{
							// Search the same textarea input, but from 1 character in front to find out if there is a "word \b.oundary".
							var textAreaReverseSubstringPlusOne = getStringByCharacterCountBehindCursor(lookBehindCursorCounter +1);

							// The entire auto-complete phrase won't be found inside the text area, so chop off whatever isn't expected to be found.
							var autoCompletePrefixFragment = loopCantStrLowerCase.substr(0, lookBehindCursorCounter);

							// Notice that a "." (RegEx "." = any character) occupies the +1 on "lookBehindCursorCounter". 
							// Without that the matching routine would trigger false positives on odd sequences, such as double consecutive characters.  
							var regExForWordBoundary = new RegExp("^.\\b" + HIPI.framework.Utilities.escapeStringForRegularExpression(autoCompletePrefixFragment));

							if(textAreaReverseSubstringPlusOne.match(regExForWordBoundary))
								isPrecedingTextareaNewlineOrSpace = true;
						}

						// Notice that this skips ahead to the next iteration of the WHILE loop and does not RETURN from the forEach iteration... the routine needs to keep looking.
						// Imagine the textarea contains "asdfa" and the auto-complete phrase is also "asdfa".
						// In this scenario the trailing "a" of the textarea would match the first "a" of the auto-complete, but since the trailing "a" is not at a word boundary the phrase would not be matched if the forEach iteration were skipped.
						if(isCursorAtStartOfTextArea || isPrecedingTextareaNewlineOrSpace){

							// The purpose of these variables and the FOR loop which follows is to find out if additional characters (to the right of the cursor) can be removed within the TextArea.
							// For example, imagine an auto-complete phrase "Hello World" with a TextArea containing "Everyone, Hell^o World and Beyond" (with the cursor at the carrot).
							// Without this "look ahead", substitution =  "Everyone, Hello World^ o World and Beyond"
							// With this "look ahead",    substitution =  "Everyone, Hello World^ and Beyond"
							var numberOfCharactersAvailableAfterCursor = textAreaStr.length - cursorPositionInTextArea;
							var autoCompleteStringAfterCursor = stateSlicesObj.cantStrArr[loopCantIndex].substr(lookBehindCursorCounter);
							var replacementEndPosition = cursorPositionInTextArea;

							for(var lookInFrontCounter = 0; lookInFrontCounter<=numberOfCharactersAvailableAfterCursor; lookInFrontCounter++){

								var lookAheadCharacterInTextArea = getSingleCharacterInFrontOfCursorByDistance(lookInFrontCounter);
								var lookAheadCharacterOnReplacement = autoCompleteStringAfterCursor.substr(lookInFrontCounter, 1);

								if(lookAheadCharacterInTextArea === lookAheadCharacterOnReplacement)
									replacementEndPosition++;
								else
									break;
							}

							// Store the auto-complete string and the positions where substitution should occur within the textarea.
							matchingCantArrayIndexesArr.push(loopCantIndex);
							matchingInputCharacterPositionStart.push(cursorPositionInTextArea - lookBehindCursorCounter);
							matchingInputCharacterPositionEnd.push(replacementEndPosition);
						}
					}

					// It might be necessary to look even further behind the cursor position before a match can be found on the auto-complete start-of-string.
					lookBehindCursorCounter++;
				}

				function getStringByCharacterCountBehindCursor(lookBackByCharCount){

					if(lookBackByCharCount > cursorPositionInTextArea)
						throw new Error("Error in getStringByCharacterCountBehindCursor, the input value is out of range.");

					return textAreaStr.substring((cursorPositionInTextArea - lookBackByCharCount), cursorPositionInTextArea);
				}

				function getSingleCharacterInFrontOfCursorByDistance(lookInFrontCharDistance){

					if(lookInFrontCharDistance + cursorPositionInTextArea > textAreaStr.length)
						throw new Error("Error in getSingleCharacterInFrontOfCursorByDistance, the input value is out of range.");

					return textAreaStr.substr((cursorPositionInTextArea + lookInFrontCharDistance), 1);
				}
			});

			// Create an array of auto-complete strings that were matched in "original case".
			var matchingAutoCompleteStringsArr = matchingCantArrayIndexesArr.map(function(loopCantIndex){
				return stateSlicesObj.cantStrArr[loopCantIndex];
			});

			var autoCompleteRows = "<ul class='auto-complete-row-container'>";

			matchingAutoCompleteStringsArr.forEach(function(loopPhrase, loopIndex){

				var maxStringLength = 150;

				if(loopPhrase.length > maxStringLength)
					loopPhrase = Utilities.truncateBackToFirstSpace(loopPhrase, maxStringLength, 15) + "...";

				autoCompleteRows += "<li class='auto-complete-row' cantIndex='"+matchingCantArrayIndexesArr[loopIndex]+"' startPos='"+matchingInputCharacterPositionStart[loopIndex]+"' endPos='"+matchingInputCharacterPositionEnd[loopIndex]+"'>" + HIPI.framework.Utilities.escapeHtml(loopPhrase) + "</li>";
			});

			autoCompleteRows += "</ul>";

			if(matchingAutoCompleteStringsArr.length){

				document.getElementById("auto-complete-results" + elementIdOfComponentInstanceWrapper).innerHTML = autoCompleteRows;

				bindClickEventsToAutoCompleteResults();

				document.getElementById("auto-complete-container" + elementIdOfComponentInstanceWrapper).style.display = "block";
			}
			else{
				hideAutoCompleteDiv();
			}

			isAutoCompleteRoutineStillRunning = false;
		}

		function bindClickEventsToAutoCompleteResults(){

			var autoCompleteSelections = document.getElementById(elementIdOfComponentInstanceWrapper).getElementsByClassName('auto-complete-row');

			for(var i=0; i<autoCompleteSelections.length; i++)
				autoCompleteSelections[i].addEventListener("click", clickHandlerForAutoCompleteRow);

			function clickHandlerForAutoCompleteRow(){

				var replalceFromStartPosition = parseInt(this.getAttribute("startPos"));
				var replalceToEndPosition = parseInt(this.getAttribute("endPos"));
				var matchedCantPosition = parseInt(this.getAttribute("cantIndex"));

				var textFromInput = document.getElementById(componentPropertiesObj.elementIdOfInput).value;

				// Add a space after the replacement string as a separator if there is not already one there.
				var nextChar = textFromInput.substr(replalceToEndPosition, 1);

				if(nextChar === " ")
					var separatorChar = "";
				else
					var separatorChar = " ";

				var newTextForInput = textFromInput.substring(0, replalceFromStartPosition) + stateSlicesObj.cantStrArr[matchedCantPosition] + separatorChar + textFromInput.substring(replalceToEndPosition);

				// There's no point in showing the auto-complete window after selecting something.
				hideAutoCompleteDiv()

				// Inject the new next into the input element and position the cursor just after the end of the replacement string.
				document.getElementById(componentPropertiesObj.elementIdOfInput).value = newTextForInput;

				HIPI.framework.Utilities.setCursorPosition(document.getElementById(componentPropertiesObj.elementIdOfInput), (replalceFromStartPosition + stateSlicesObj.cantStrArr[matchedCantPosition].length));

				return false;
			}
		}

		// Check for existence first, in case of a call invoked by SetTimeout.
		function hideAutoCompleteDiv(){
			if(document.getElementById("auto-complete-container" + elementIdOfComponentInstanceWrapper))
				document.getElementById("auto-complete-container" + elementIdOfComponentInstanceWrapper).style.display = "none";
		}
	});

	componentObj.addStateExtractor(function(componentPropertiesObj, globalStateObj){

		var retStateObj = {};

		// Attach 2 copies of the auto-complete sources to the extracted state object.
		// Matching should be case insensitive but replacement should preserve the original characters.
		retStateObj.cantStrArr = HIPI.lib.Contradictions.getCantStringsForAutoComplete(globalStateObj);

		retStateObj.cantStrLowerCaseArr = retStateObj.cantStrArr.map(function(loopCantStr){
			return loopCantStr.toLowerCase();
		});

		return retStateObj;
	});

	HIPI.framework.ComponentCollection.addComponent(componentObj);
});
