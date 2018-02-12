"use strict";

// All functions defined in this file should be "pure" and return an "action object" that can be passed to the AppState.dispatchAction() method.
var ActionObjects = {};

ActionObjects.initializeStore = function(){

	return {"type": HIPI.state.ActionNames.INITIALIZE_STORE };
};

ActionObjects.changeDomainName = function(domainName){

	HIPI.framework.Utilities.ensureTypeString(domainName);

	return {"type": HIPI.state.ActionNames.CHANGE_DOMAIN, "domainName":domainName };
};

ActionObjects.showNewMessageDialog = function(domainName, dialogPositionChain){

	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);

	return {"type": HIPI.state.ActionNames.SHOW_NEW_MESSAGE_DIALOG, "domain":domainName, "dialogPositionChain":dialogPositionChain };
};

ActionObjects.hideNewMessageDialog = function(domainName, dialogPositionChain){

	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);

	return {"type": HIPI.state.ActionNames.HIDE_NEW_MESSAGE_DIALOG, "domain":domainName, "dialogPositionChain":dialogPositionChain };
};

ActionObjects.submitNewMessage = function(domainName, dialogPositionChain, messageStr){

	HIPI.framework.Utilities.ensureTypeString(messageStr);
	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);

	return {"type": HIPI.state.ActionNames.SUBMIT_NEW_MESSAGE, "domain":domainName, "dialogPositionChain":dialogPositionChain, "message":messageStr };
};

ActionObjects.submitNewContradiction = function(domainName, dialogPositionChain, contradictionPositionChain, cantText, cuzText){

	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(contradictionPositionChain);
	HIPI.framework.Utilities.ensureTypeString(cantText);
	HIPI.framework.Utilities.ensureTypeString(cuzText);

	return {"type": HIPI.state.ActionNames.SUBMIT_NEW_CONTRADICTION, "domain":domainName, "dialogPositionChain":dialogPositionChain, "contradictionPositionChain":contradictionPositionChain, "cantText":cantText, "cuzText":cuzText };
};

ActionObjects.selectMessage = function(domainName, dialogPositionChain, openMainTab){

	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);
	HIPI.framework.Utilities.ensureTypeString(openMainTab, true);

	return {"type": HIPI.state.ActionNames.SELECT_MESSAGE, "domain":domainName, "dialogPositionChain":dialogPositionChain, "openMainTab":openMainTab };
};

ActionObjects.goPerpendicular = function(domainName, dialogPositionChain){

	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);

	return {"type": HIPI.state.ActionNames.GO_PERPENDICULAR, "domain":domainName, "dialogPositionChain":dialogPositionChain };
};

ActionObjects.leavePerpendicular = function(domainName, dialogPositionChain){

	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);

	return {"type": HIPI.state.ActionNames.LEAVE_PERPENDICULAR, "domain":domainName, "dialogPositionChain":dialogPositionChain };
};

ActionObjects.showContradictWindow = function(domainName, dialogPositionChain, contradictionPositionChain, cachedSuggestedContradictions){

	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(contradictionPositionChain);

	if(cachedSuggestedContradictions !== null){
		if(!Array.isArray(cachedSuggestedContradictions))
			throw new TypeError("Error in ActionObjects.showContradictWindow. If the 4th argument is not null then it must be of type Array.");
	}

	return {"type": HIPI.state.ActionNames.SHOW_CONTRADICT_WINDOW, "domain":domainName, "dialogPositionChain":dialogPositionChain, "contradictionPositionChain":contradictionPositionChain, "cachedSuggestedContradictions":cachedSuggestedContradictions };
};

ActionObjects.hideContradictWindow = function(domainName, dialogPositionChain, contradictionPositionChain){

	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(contradictionPositionChain);

	return {"type": HIPI.state.ActionNames.HIDE_CONTRADICT_WINDOW, "domain":domainName, "dialogPositionChain":dialogPositionChain, "contradictionPositionChain":contradictionPositionChain };
};

ActionObjects.newMessageSelectTab = function(domainName, dialogPositionChain, tabName){

	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);
	HIPI.framework.Utilities.ensureTypeString(tabName);

	return {"type": HIPI.state.ActionNames.NEW_MESSAGE_SELECT_TAB, "domain":domainName, "dialogPositionChain":dialogPositionChain, "tabName":tabName };
};

ActionObjects.newContradictionSelectTab = function(domainName, dialogPositionChain, contradictionPositionChain, tabName){

	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(contradictionPositionChain);
	HIPI.framework.Utilities.ensureTypeString(tabName);

	return {"type": HIPI.state.ActionNames.NEW_CONTRADICTION_SELECT_TAB, "domain":domainName, "dialogPositionChain":dialogPositionChain, "contradictionPositionChain":contradictionPositionChain, "tabName":tabName };
};

ActionObjects.createSymbolicLink = function(domainName, dialogPositionChain, linkPositionChain){

	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(linkPositionChain);

	return {"type": HIPI.state.ActionNames.CREATE_SYMBOLIC_LINK, "domain":domainName, "dialogPositionChain":dialogPositionChain, "linkPositionChain":linkPositionChain };
};

ActionObjects.viewDialogProperties = function(viewFlag){

	HIPI.framework.Utilities.ensureTypeBoolean(viewFlag);

	return {"type": HIPI.state.ActionNames.VIEW_DIALOG_PROPERTIES, "viewFlag":viewFlag };
};

ActionObjects.mainSelectTab = function(domainName, tabName){

	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureTypeString(tabName);

	return {"type": HIPI.state.ActionNames.MAIN_SELECT_TAB, "domain":domainName, "tabName":tabName };
};

ActionObjects.changeUserSetting = function(settingName, settingValue){

	HIPI.framework.Utilities.ensureTypeString(settingName);
	HIPI.framework.Utilities.ensureTypeBoolean(settingValue);

	return {"type": HIPI.state.ActionNames.CHANGE_USER_SETTING, "settingName":settingName, "settingValue":settingValue };
};

ActionObjects.contributionDeleteLeaf = function(domainName, linkingArr){

	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureTypeArray(linkingArr);

	return {"type": HIPI.state.ActionNames.CONTRIBUTION_DELETE_LEAF, "domain":domainName, "linkingArr":linkingArr };
};

ActionObjects.contributionRemoveOwnership = function(domainName, linkingArr){

	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureTypeArray(linkingArr);

	return {"type": HIPI.state.ActionNames.CONTRIBUTION_REMOVE_OWNERSHIP, "domain":domainName, "linkingArr":linkingArr };
};

ActionObjects.addNewDomain = function(domainName){

	HIPI.framework.Utilities.ensureTypeString(domainName);

	return {"type": HIPI.state.ActionNames.ADD_NEW_DOMAIN, "domainName":domainName };
};

ActionObjects.editMessage = function(domainName, dialogPositionChain){

	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);

	return {"type": HIPI.state.ActionNames.EDIT_MESSAGE, "domain":domainName, "dialogPositionChain":dialogPositionChain };
};

ActionObjects.hideEditMessage = function(domainName, dialogPositionChain){

	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);

	return {"type": HIPI.state.ActionNames.HIDE_EDIT_MESSAGE, "domain":domainName, "dialogPositionChain":dialogPositionChain };
};

ActionObjects.updateMessage = function(domainName, dialogPositionChain, messageStr){

	HIPI.framework.Utilities.ensureTypeString(domainName);
	HIPI.framework.Utilities.ensureStringOfCommaSeparatedIntegers(dialogPositionChain);
	HIPI.framework.Utilities.ensureTypeString(messageStr);

	return {"type": HIPI.state.ActionNames.UPDATE_MESSAGE, "domain":domainName, "dialogPositionChain":dialogPositionChain, "message":messageStr };
};
