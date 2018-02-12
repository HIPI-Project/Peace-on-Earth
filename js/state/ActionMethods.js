"use strict";

var ActionMethods = {};

ActionMethods.initializeStore = function(){

	HIPI.framework.AppState.dispatchAction( HIPI.state.ActionObjects.initializeStore() );
};

ActionMethods.changeDomainName = function(domainName){

	HIPI.framework.AppState.dispatchAction( HIPI.state.ActionObjects.changeDomainName(domainName) );
};

ActionMethods.showNewMessageDialog = function(domain, dialogPositionChain){

	HIPI.framework.AppState.dispatchAction( HIPI.state.ActionObjects.showNewMessageDialog(domain, dialogPositionChain) );
};

ActionMethods.hideNewMessageDialog = function(domain, dialogPositionChain){

	HIPI.framework.AppState.dispatchAction( HIPI.state.ActionObjects.hideNewMessageDialog(domain, dialogPositionChain) );
};

ActionMethods.submitNewMessage = function(domainName, dialogPositionChain, messageStr){

	HIPI.framework.AppState.dispatchAction( HIPI.state.ActionObjects.submitNewMessage(domainName, dialogPositionChain, messageStr) );
};

ActionMethods.submitNewContradiction = function(domainName, dialogPositionChain, contradictionPositionChain, cantText, cuzText){

	HIPI.framework.AppState.dispatchAction( HIPI.state.ActionObjects.submitNewContradiction(domainName, dialogPositionChain, contradictionPositionChain, cantText, cuzText) );
};

ActionMethods.selectMessage = function(domainName, dialogPositionChain, openMainTab){

	HIPI.framework.AppState.dispatchAction( HIPI.state.ActionObjects.selectMessage(domainName, dialogPositionChain, openMainTab) );
};

ActionMethods.goPerpendicular = function(domainName, dialogPositionChain){

	HIPI.framework.AppState.dispatchAction( HIPI.state.ActionObjects.goPerpendicular(domainName, dialogPositionChain) );
};

ActionMethods.leavePerpendicular = function(domainName, dialogPositionChain){

	HIPI.framework.AppState.dispatchAction( HIPI.state.ActionObjects.leavePerpendicular(domainName, dialogPositionChain) );
};

ActionMethods.showContradictWindow = function(domainName, dialogPositionChain, contradictionPositionChain, cachedSuggestedContradictions){

	HIPI.framework.AppState.dispatchAction( HIPI.state.ActionObjects.showContradictWindow(domainName, dialogPositionChain, contradictionPositionChain, cachedSuggestedContradictions) );
};

ActionMethods.hideContradictWindow = function(domainName, dialogPositionChain, contradictionPositionChain){

	HIPI.framework.AppState.dispatchAction( HIPI.state.ActionObjects.hideContradictWindow(domainName, dialogPositionChain, contradictionPositionChain) );
};

ActionMethods.newMessageSelectTab = function(domainName, dialogPositionChain, tabName){

	HIPI.framework.AppState.dispatchAction( HIPI.state.ActionObjects.newMessageSelectTab(domainName, dialogPositionChain, tabName) );
};

ActionMethods.newContradictionSelectTab = function(domainName, dialogPositionChain, contradictionPositionChain, tabName){

	HIPI.framework.AppState.dispatchAction( HIPI.state.ActionObjects.newContradictionSelectTab(domainName, dialogPositionChain, contradictionPositionChain, tabName) );
};

ActionMethods.createSymbolicLink = function(domainName, dialogPositionChain, linkPositionChain){

	HIPI.framework.AppState.dispatchAction( HIPI.state.ActionObjects.createSymbolicLink(domainName, dialogPositionChain, linkPositionChain) );
};

ActionMethods.viewDialogProperties = function(viewFlag){

	HIPI.framework.AppState.dispatchAction( HIPI.state.ActionObjects.viewDialogProperties(viewFlag) );
};

ActionMethods.mainSelectTab = function(domainName, tabName){

	HIPI.framework.AppState.dispatchAction( HIPI.state.ActionObjects.mainSelectTab(domainName, tabName) );
};

ActionMethods.changeUserSetting = function(settingName, settingValue){

	HIPI.framework.AppState.dispatchAction( HIPI.state.ActionObjects.changeUserSetting(settingName, settingValue) );
};

ActionMethods.contributionDeleteLeaf = function(domainName, linkingArr){

	HIPI.framework.AppState.dispatchAction( HIPI.state.ActionObjects.contributionDeleteLeaf(domainName, linkingArr) );
};

ActionMethods.contributionRemoveOwnership = function(domainName, linkingArr){

	HIPI.framework.AppState.dispatchAction( HIPI.state.ActionObjects.contributionRemoveOwnership(domainName, linkingArr) );
};

ActionMethods.addNewDomain = function(domainName){

	HIPI.framework.AppState.dispatchAction( HIPI.state.ActionObjects.addNewDomain(domainName) );
};

ActionMethods.editMessage = function(domainName, dialogPositionChain){

	HIPI.framework.AppState.dispatchAction( HIPI.state.ActionObjects.editMessage(domainName, dialogPositionChain) );
};

ActionMethods.hideEditMessage = function(domainName, dialogPositionChain){

	HIPI.framework.AppState.dispatchAction( HIPI.state.ActionObjects.hideEditMessage(domainName, dialogPositionChain) );
};

ActionMethods.updateMessage = function(domainName, dialogPositionChain, messageStr){

	HIPI.framework.AppState.dispatchAction( HIPI.state.ActionObjects.updateMessage(domainName, dialogPositionChain, messageStr) );
};
