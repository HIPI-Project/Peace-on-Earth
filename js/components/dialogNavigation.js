"use strict";
postInit(function(){

	var componentObj = new HIPI.framework.Component();

	componentObj.defineHtmlElementSelector("dialogNavigation");
	componentObj.defineComponentPropName("domain");
	componentObj.defineComponentPropName("currentDialogPositionChain");
	componentObj.defineComponentPropName("previousDialogPositionChain");
	componentObj.defineComponentPropName("nextDialogPositionChain");

	componentObj.addHtmlGenerator(function(elementIdOfComponentInstanceWrapper, componentPropertiesObj, stateSlicesObj){

		if(HIPI.lib.Dialogs.isDialogLevelSkeptical(componentPropertiesObj.currentDialogPositionChain)){
			var choiceText = "Agree ^";
			var dialogWrapperClass = "skeptical-dialog";
			var navigationText = "Disagree";
		}
		else{
			var choiceText = "Disagree or Unsure ^";
			var dialogWrapperClass = "trusting-dialog";
			var navigationText = "Agree";
		}

		if(stateSlicesObj.doesPerpendicularMessageExistFlag)
			var choiceClass = "perpendicular-dialog-message-exists"
		else
			var choiceClass = "perpendicular-dialog-message-not-exists"

		var retHtml = "<div class='dialog-navigation-wrapper "+dialogWrapperClass+"'>" + 
							"<table cellpadding='0' cellspacing='0' width='100%'>" +
							"<tr>" +
								"<td width='33%'>";

									if(componentPropertiesObj.previousDialogPositionChain)
										retHtml += "<button targetDialogPosition='"+componentPropertiesObj.previousDialogPositionChain+"' id='btn-dialog-nav-previous"+elementIdOfComponentInstanceWrapper+"'>"+navigationText+" / Previous</button>";

					retHtml += "</td>" +
								"<td width='33%'>" +
									"<a href='#' title='"+HIPI.framework.Utilities.escapeHtml(stateSlicesObj.messageStr)+"' class='btn-dialog-choice "+choiceClass+"' id='btn-dialog-choice"+elementIdOfComponentInstanceWrapper+"'>"+choiceText+"</a>" +
								"</td>" +
								"<td width='33%' align='right'>";

									if(componentPropertiesObj.nextDialogPositionChain)
										retHtml += "<button targetDialogPosition='"+componentPropertiesObj.nextDialogPositionChain+"' id='btn-dialog-nav-next"+elementIdOfComponentInstanceWrapper+"'>" + navigationText  + " / Next</button>";

						retHtml += "</td>" +
							"</tr>" +
						"</table>" +
					"</div>";

		return retHtml;
	});

	componentObj.addStateExtractor(function(componentPropertiesObj, globalStateObj){

		var retStateObj = {};

		retStateObj.messageStr = HIPI.lib.Dialogs.getMessageFromDialogPosition(globalStateObj, componentPropertiesObj.domain, componentPropertiesObj.currentDialogPositionChain);

		// Let the user know if there is a message for them to read if they choose to go perpendicular.
		var childDialogPositionsArr = HIPI.lib.Dialogs.getArrayOfChildDialogPositionChainsSortedByDepth(globalStateObj, componentPropertiesObj.domain, componentPropertiesObj.currentDialogPositionChain);

		childDialogPositionsArr = HIPI.lib.General.filterDialogPositionChainsByUserSettings(globalStateObj, componentPropertiesObj.domain, childDialogPositionsArr);

		retStateObj.doesPerpendicularMessageExistFlag = childDialogPositionsArr.length ? true : false;

		return retStateObj;
	});

	componentObj.addDomBindRoutine(function(elementIdOfComponentInstanceWrapper, componentPropertiesObj, stateSlicesObj){

		var previousDialogButton = document.getElementById("btn-dialog-nav-previous"+elementIdOfComponentInstanceWrapper);
		if(previousDialogButton){

			previousDialogButton.addEventListener("click", function(e){

				// Link the Next/Previous animation with a Promise chain to follow the animation of closing the Dialog window stack.
				animateRemovalOfDialogWindowStack()
				.then(function(){
					return animateNextPrevious(false);
				})
				.then(function(){
					HIPI.state.ActionMethods.selectMessage(componentPropertiesObj.domain, previousDialogButton.getAttribute("targetDialogPosition"));
				});

				e.preventDefault();

				return false;
			});
		}

		var nextDialogButton = document.getElementById("btn-dialog-nav-next"+elementIdOfComponentInstanceWrapper);
		if(nextDialogButton){

			nextDialogButton.addEventListener("click", function(e){

				animateRemovalOfDialogWindowStack()
				.then(function(){
					return animateNextPrevious(true);
				})
				.then(function(){
					HIPI.state.ActionMethods.selectMessage(componentPropertiesObj.domain, nextDialogButton.getAttribute("targetDialogPosition"));
				});

				e.preventDefault();

				return false;
			});
		}

		document.getElementById("btn-dialog-choice"+elementIdOfComponentInstanceWrapper).addEventListener("click", function(e){

			HIPI.state.ActionMethods.goPerpendicular(componentPropertiesObj.domain, componentPropertiesObj.currentDialogPositionChain);

			e.preventDefault();

			return false;
		});

		function animateNextPrevious(isNext){

			var nextPreviousAnimationDuration = 200;

			return new Promise(function(resolve, reject){

				// This will move the message container.
				var dialogMessageElem = getClosestDomDialogContainerElement().querySelector(".dialog-message");

				dialogMessageElem.style.animationDuration = nextPreviousAnimationDuration + "ms";
				dialogMessageElem.style.position = "relative";

				dialogMessageElem.className += " " + (isNext ? "dialog-message-animate-next" : "dialog-message-animate-previous");

				// This controls the animation of the "In Question" / "Answered" containers.
				var questionedMessageElem = getClosestDomDialogContainerElement().querySelector(".dialog-base-status-bar, .dialog-window-status-bar");

				questionedMessageElem.style.animationDuration = nextPreviousAnimationDuration + "ms";
				questionedMessageElem.style.position = "relative";

				var questionedStatusClassNamesBeforeAnimation = questionedMessageElem.className;

				questionedMessageElem.className += " " + (isNext ? "dialog-message-animate-next" : "dialog-message-animate-previous");

				setTimeout(function(){ 

					// The Questioned status container doesn't get restored by the state because it is placed outside of the component.
					// Make sure to put it back where it was found so that it will be available for a sibling.
					questionedMessageElem.className = questionedStatusClassNamesBeforeAnimation; 

					resolve();

				}, nextPreviousAnimationDuration);
			});
		}

		function animateRemovalOfDialogWindowStack(){

			var closestDialogWrapperElement = getClosestDomDialogContainerElement();

			return HIPI.lib.General.animateRemovalOfDialogStackFromDom(closestDialogWrapperElement.id);
		}

		function getClosestDomDialogContainerElement(){

			var componentWrapperElem = document.getElementById(elementIdOfComponentInstanceWrapper);

			var closestDialogWindowElement = HIPI.framework.Utilities.getClosestHtmlElementWithClassName(componentWrapperElem, "dialog-window");

			// If a Dialog Window can't be found then assume the user clicked on a Base Message, in which case start the cascade from the Domain root.
			if(!closestDialogWindowElement)
				closestDialogWindowElement = HIPI.framework.Utilities.getClosestHtmlElementWithClassName(componentWrapperElem, "section-app-main");

			if(!closestDialogWindowElement)
				throw new Error("Error in getClosestDomDialogContainerElement. Could not find a Dialog");

			return closestDialogWindowElement;
		}
	});

	componentObj.addReducer(function(stateObj, actionObj){

		HIPI.framework.Utilities.ensureTypeObject(stateObj);
		HIPI.framework.Utilities.ensureValidActionObject(actionObj);

		switch(actionObj.type){

			case HIPI.state.ActionNames.SELECT_MESSAGE :

				HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(actionObj.dialogPositionChain);

				if(!actionObj.dialogPositionChain)
					throw new Error("Error in <dialogNavigation> Reducer. The dialogPositionChain cannot be empty because it must be possible to walk back 1 level from this address.");

				// This method will also unselect any other selected messages in the database.
				stateObj = HIPI.lib.Dialogs.selectDialogPositionChain(stateObj, actionObj.domain, actionObj.dialogPositionChain);

				// Sometimes the user may want to select a message and jump to a Main Tab at the same time.
				if(actionObj.openMainTab){

					HIPI.lib.General.ensureValidMainTabName(actionObj.openMainTab);

					var domainRoot = HIPI.lib.General.getReferenceToDomainRoot(stateObj, actionObj.domain);

					domainRoot.mainSelectedTab = actionObj.openMainTab;
				}

				break;

			case HIPI.state.ActionNames.GO_PERPENDICULAR :

				// If a message hasn't been selected yet (such as if the page was just loaded without any navigation) then select the default message.
				stateObj = HIPI.lib.Dialogs.selectDialogPositionChain(stateObj, actionObj.domain, actionObj.dialogPositionChain);

				var dialogSubArrRef = HIPI.lib.Dialogs.getDialogPositionReference(stateObj, actionObj.domain, actionObj.dialogPositionChain);

				// Reset these properties every time the user goes perpendicular.
				dialogSubArrRef.showContradictWindow = false;

				dialogSubArrRef.showPerpendicularLevel = true;

				// Select the first dialog position in the chain (perpendicular to the given message).
				var childDialogPositionsArr = HIPI.lib.Dialogs.getArrayOfChildDialogPositionChainsSortedByDepth(stateObj, actionObj.domain, actionObj.dialogPositionChain);

				childDialogPositionsArr = HIPI.lib.General.filterDialogPositionChainsByUserSettings(stateObj, actionObj.domain, childDialogPositionsArr);

				if(childDialogPositionsArr.length){

					var firstChildDialogRefPerpendicular = HIPI.lib.Dialogs.getDialogPositionReference(stateObj, actionObj.domain, childDialogPositionsArr[0]);

					firstChildDialogRefPerpendicular.selected = true;
				}

				break;

			case HIPI.state.ActionNames.LEAVE_PERPENDICULAR :

				// In case the user hits a "close button" on a pop-over behind a child window, this action should close all descendant windows.
				stateObj = HIPI.lib.Dialogs.closePerpendicularDialogsAboveCurrent(stateObj, actionObj.domain, actionObj.dialogPositionChain);

				break;
		}

		return stateObj;
	});

	HIPI.framework.ComponentCollection.addComponent(componentObj);
});
