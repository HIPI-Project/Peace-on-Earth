"use strict";
postInit(function(){

	var componentObj = new HIPI.framework.Component();

	componentObj.defineHtmlElementSelector("newMessageTabs");
	componentObj.defineComponentPropName("domain");
	componentObj.defineComponentPropName("dialogPositionChain");

	componentObj.addHtmlGenerator(function(elementIdOfComponentInstanceWrapper, componentPropertiesObj, stateSlicesObj){

		// Don't allow Symbolic Linking from a Base Message.
		if(componentPropertiesObj.dialogPositionChain){

			var classExtension = HIPI.lib.Dialogs.isDialogLevelSkeptical(componentPropertiesObj.dialogPositionChain) ? "trusting" : "skeptical";

			var retHtml = "<nav class='tabs-nav'>" +
							"<ul>" +
								"<li><a class='"+(stateSlicesObj.newMessageSelectedTab === "custom-text" ? "active-nav" : "inactive-nav")+"' id='nav-new-message-custom"+elementIdOfComponentInstanceWrapper+"' href='#'>New Message</a></li>" +
								"<li><a class='"+(stateSlicesObj.newMessageSelectedTab === "symbolic-link" ? "active-nav" : "inactive-nav")+"' id='nav-new-message-symbolic"+elementIdOfComponentInstanceWrapper+"' href='#'>Link Existing Response</a></li>" +
							"</ul>" +
							"</nav>" +
							"<div class='nav-new-message-bottom-border-"+classExtension+"'></div>" +
							"<div class='tabs-nav-container'>";

						if(stateSlicesObj.newMessageSelectedTab === "custom-text")
							retHtml += "<newMessageCustomText domain='"+componentPropertiesObj.domain+"' dialogPositionChain='"+componentPropertiesObj.dialogPositionChain+"'></newMessageCustomText>";
						else if(stateSlicesObj.newMessageSelectedTab === "symbolic-link")
							retHtml += "<newMessageSymbolicLink domain='"+componentPropertiesObj.domain+"' dialogPositionChain='"+componentPropertiesObj.dialogPositionChain+"'></newMessageSymbolicLink>";
						else
							throw new Error("Error in addHtmlGenerator for the <newMessageTabs> component. Cannot determine the selected tab.");

			retHtml += "</div>";
		}
		else{
			retHtml = "<newMessageCustomText domain='"+componentPropertiesObj.domain+"' dialogPositionChain='"+componentPropertiesObj.dialogPositionChain+"'></newMessageCustomText>";
		}

		// There isn't a message to respond to when adding a message at the base.
		if(stateSlicesObj.respondToMessage)
			retHtml += "<h2 class='respond-to-title'>In Response To ...</h2><div class='new-message-responding-to-message'>" + HIPI.framework.Utilities.htmlizeStringWithLineBreaks(stateSlicesObj.respondToMessage) + "</div>";
		else
			retHtml += "<h2 class='respond-to-title'>About Base Messages</h2><div class='new-message-responding-to-message'>" + HIPI.framework.Utilities.escapeHtml(HIPI.lib.Language.byKey.baseMessageDescription) + "</div>";

		return retHtml;
	});

	componentObj.addStateExtractor(function(componentPropertiesObj, globalStateObj){

		var retStateObj = {};

		var dialogSubArrRef = HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain);

		if(!dialogSubArrRef.newMessageSelectedTab)
			retStateObj.newMessageSelectedTab = "custom-text";
		else
			retStateObj.newMessageSelectedTab = dialogSubArrRef.newMessageSelectedTab;

		if(componentPropertiesObj.dialogPositionChain)
			retStateObj.respondToMessage = HIPI.lib.Dialogs.getMessageFromDialogPosition(globalStateObj, componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain);

		return retStateObj;
	});

	componentObj.addDomBindRoutine(function(elementIdOfComponentInstanceWrapper, componentPropertiesObj, stateSlicesObj){

		var tabNewMessageElementId = "nav-new-message-custom"+elementIdOfComponentInstanceWrapper;

		if(document.getElementById(tabNewMessageElementId)){

			document.getElementById(tabNewMessageElementId).addEventListener("click", function(e){

				e.preventDefault();

				HIPI.state.ActionMethods.newMessageSelectTab(componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain, "custom-text");

				return false;
			});
		}

		var tabSymbolicLinkElementId = "nav-new-message-symbolic"+elementIdOfComponentInstanceWrapper;

		if(document.getElementById(tabSymbolicLinkElementId)){

			document.getElementById(tabSymbolicLinkElementId).addEventListener("click", function(e){

				e.preventDefault();

				HIPI.state.ActionMethods.newMessageSelectTab(componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain, "symbolic-link");

				return false;
			});
		}
	});

	componentObj.addReducer(function(stateObj, actionObj){

		HIPI.framework.Utilities.ensureTypeObject(stateObj);
		HIPI.framework.Utilities.ensureValidActionObject(actionObj);

		switch(actionObj.type){

			case HIPI.state.ActionNames.NEW_MESSAGE_SELECT_TAB :

				// Get a reference to the dialog array that's pointed to by the dialogPositionChain.
				var subArrayRef = HIPI.lib.Dialogs.getDialogPositionReference(stateObj, actionObj.domain, actionObj.dialogPositionChain);

				if(["custom-text", "symbolic-link"].indexOf(actionObj.tabName) === -1)
					throw new Error("Error in addReducer for <newMessageTabs> component. The tabName is invalid: " + actionObj.tabName);

				subArrayRef.newMessageSelectedTab = actionObj.tabName;

				console.log("Select New Message Tab:", actionObj.tabName);

				break;
		}

		return stateObj;
	});

	HIPI.framework.ComponentCollection.addComponent(componentObj);
});
