"use strict";

postInit(function(){

	var componentObj = new HIPI.framework.Component();

	componentObj.defineHtmlElementSelector("userSettings");

	componentObj.addHtmlGenerator(function(elementIdOfComponentInstanceWrapper, componentPropertiesObj, stateSlicesObj){

		var showContradictionsCheckbox = stateSlicesObj.showContradictedEntries ? "checked='checked'" : "";
		var showEditButtonsCheckbox = stateSlicesObj.showEditButtons ? "checked='checked'" : "";

		var retStr = "<div class='user-settings-container'>" +
							"<div class='user-setting-icon' id='user-setting-icon"+elementIdOfComponentInstanceWrapper+"'>"+
								"<div class='user-settings-icon-hamburger-layer'></div>" +
								"<div class='user-settings-icon-hamburger-layer'></div>" +
								"<div class='user-settings-icon-hamburger-layer'></div>" +
							"</div>"+
							"<div class='user-settings-menu' id='user-settings-menu"+elementIdOfComponentInstanceWrapper+"'>"+
								"<div class='user-setting-row'>"+
									"<input type='checkbox' "+showContradictionsCheckbox+" id='user-setting-checkbox-show-contradicted"+elementIdOfComponentInstanceWrapper+"' /> " +
									"<strong>Show contradicted messages?</strong>" + 
									"<p>If this setting is enabled contradicted messages will be shown with a <span style='text-decoration: line-through;'>line through</span>.</p>" + 
								"</div>"+
								"<div class='user-setting-row'>"+
									"<input type='checkbox' "+showEditButtonsCheckbox+" id='user-setting-checkbox-enable-editing"+elementIdOfComponentInstanceWrapper+"' /> " +
									"<strong>Show Edit Buttons</strong>" + 
									"<p>If enabled this will have a performance impact on large domains because the permission check is expensive.</p>" + 
								"</div>"+
								"<div class='user-setting-row'>"+
									"<a href='#' id='create-domain-link"+elementIdOfComponentInstanceWrapper+"'>Create New Domain</a>" +
								"</div>"+
							"</div>"+
						"</div>";

		return retStr;
	});

	componentObj.addStateExtractor(function(componentPropertiesObj, globalStateObj){

		var stateSlices = {};

		if(!globalStateObj.privateState.userSettings)
			globalStateObj.privateState.userSettings = {};

		stateSlices.showContradictedEntries = globalStateObj.privateState.userSettings.showContradictedEntries ? true : false;

		stateSlices.showEditButtons = globalStateObj.privateState.userSettings.showEditButtons ? true : false;

		stateSlices.allDomainNamesUpperCaseArr = globalStateObj.domains.map(function(loopDomainObj){
			return loopDomainObj.domainName.toUpperCase();
		});

		return stateSlices;
	});

	componentObj.addReducer(function(stateObj, actionObj){

		HIPI.framework.Utilities.ensureTypeObject(stateObj);
		HIPI.framework.Utilities.ensureValidActionObject(actionObj);

		switch(actionObj.type){

			case HIPI.state.ActionNames.CHANGE_USER_SETTING :

				if(!stateObj.privateState)
					throw new Error("Error in CHANGE_USER_SETTING reducer, cannot find a privateState key on the global object.");

				if(!stateObj.privateState.userSettings)
					stateObj.privateState.userSettings = {};

				if(actionObj.settingName === "showContradictedEntries")
					stateObj.privateState.userSettings.showContradictedEntries = actionObj.settingValue;
				else if(actionObj.settingName === "showEditButtons")
					stateObj.privateState.userSettings.showEditButtons = actionObj.settingValue;
				else if(actionObj.settingName === "showSymbolicLinksOnMap")
					stateObj.privateState.userSettings.showSymbolicLinksOnMap = actionObj.settingValue;
				else
					throw new Error("Error in CHANGE_USER_SETTING reducer, cannot find a matching setting name: " + actionObj.settingName);

				break;

			case HIPI.state.ActionNames.ADD_NEW_DOMAIN :

				if(!stateObj.domains || !Array.isArray(stateObj.domains))
					throw new Error("Error in ADD_NEW_DOMAIN reducer, cannot find a domains array on the global object.");

				var newDomainName = HIPI.framework.Utilities.trimText(actionObj.domainName);

				if(!newDomainName)
					throw new Error("Error in ADD_NEW_DOMAIN reducer, the new domain name does not exist.");

				var allDomainNamesUpperCaseArr = stateObj.domains.map(function(loopDomainObj){
					return loopDomainObj.domainName.toUpperCase();
				});

				if(allDomainNamesUpperCaseArr.indexOf(newDomainName.toUpperCase()) > -1)
					throw new Error("Error in ADD_NEW_DOMAIN reducer, the new domain already exists in the database.");

				var newDomainObj = {};

				newDomainObj.domainName = newDomainName;
				newDomainObj.dialogs = [];

				stateObj.domains.push(newDomainObj);

				break;
		}

		return stateObj;
	});

	componentObj.addDomBindRoutine(function(elementIdOfComponentInstanceWrapper, componentPropertiesObj, stateSlicesObj){

		var userDetailsMenuIsOpen = false;

		var userDetailsMenu = document.getElementById('user-settings-menu'+elementIdOfComponentInstanceWrapper);
		var linkUserDetails = document.getElementById('user-setting-icon'+elementIdOfComponentInstanceWrapper);

		linkUserDetails.addEventListener('click', function(){

			if(userDetailsMenuIsOpen){

				userDetailsMenu.style.display = "none";
				userDetailsMenuIsOpen = false;
			}
			else{

				userDetailsMenu.style.display = "block";
				userDetailsMenuIsOpen = true;
			}
		});

		// Let users close the user-settings menu using the ESC key.
		document.onkeyup = function(e){

			e = e || window.event;

			var escapeKeyPressed = false;

			// The "keyCode" property is on its way to deprecation.
			if("key" in e)
				escapeKeyPressed = (e.key === "Escape" || e.key === "Esc");
			else
				escapeKeyPressed = (e.keyCode == 27);

			if(!escapeKeyPressed)
				return;

			if(userDetailsMenuIsOpen){

				userDetailsMenu.style.display = "none";
				userDetailsMenuIsOpen = false;
			}
		};

		var checkboxElemShowContradicted = document.getElementById("user-setting-checkbox-show-contradicted" + elementIdOfComponentInstanceWrapper);

		checkboxElemShowContradicted.addEventListener('click', function(){

			HIPI.state.ActionMethods.changeUserSetting("showContradictedEntries", this.checked);

			HIPI.framework.AppState.saveStore()
			.then(function(){
				console.log("Store was saved successfully after changing a User Setting: showContradictedEntries");
			});
		});

		var checkboxElemShowEditButtons = document.getElementById("user-setting-checkbox-enable-editing" + elementIdOfComponentInstanceWrapper);

		checkboxElemShowEditButtons.addEventListener('click', function(){

			HIPI.state.ActionMethods.changeUserSetting("showEditButtons", this.checked);

			HIPI.framework.AppState.saveStore()
			.then(function(){
				console.log("Store was saved successfully after changing a User Setting: showEditButtons");
			});
		});

		var createNewDomainLink = document.getElementById('create-domain-link'+elementIdOfComponentInstanceWrapper);

		createNewDomainLink.addEventListener("click", function(e){

			e.preventDefault();

			var newDomainName = prompt("Enter a new name for the domain that you want to create.");

			if(newDomainName === null)
				return;

			newDomainName = HIPI.framework.Utilities.trimText(newDomainName);

			if(!newDomainName)
				return;

			if(newDomainName.length < 3){
				alert("The domain name must have a minimum of 3 characters.");
				return;
			}

			if(!newDomainName.match(/^(\w|-|\s|\d){3,}$/)){
				alert("The domain name may only contain letters, numbers, dashes, underscores, and spaces.");
				return;
			}

			if(stateSlicesObj.allDomainNamesUpperCaseArr.indexOf(newDomainName.toUpperCase()) > -1){
				alert("This domain name already exists.");
				return;
			}

			HIPI.state.ActionMethods.addNewDomain(newDomainName);

			HIPI.framework.AppState.saveStore()
			.then(function(){
				console.log("Store was saved successfully after adding a new domain.");
			});

			return false;
		});
	});

	HIPI.framework.ComponentCollection.addComponent(componentObj);
});
