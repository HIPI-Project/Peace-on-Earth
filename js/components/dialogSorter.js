"use strict";
postInit(function(){

	var componentObj = new HIPI.framework.Component();

	componentObj.defineHtmlElementSelector("dialogSorter");
	componentObj.defineComponentPropName("dialogPositionChain");
	componentObj.defineComponentPropName("domain");

	componentObj.addHtmlGenerator(function(elementIdOfComponentInstanceWrapper, componentPropertiesObj, stateSlicesObj){

		if(HIPI.lib.Dialogs.isDialogLevelSkeptical(stateSlicesObj.childDialogPositionsArr[stateSlicesObj.selectedMessagePosition]))
			var dialogWrapperClassName = "skeptical-dialog";
		else
			var dialogWrapperClassName = "trusting-dialog";

		var retHtml = "<div class='dialog-wrapper "+dialogWrapperClassName+"'>";

		var previousDialogPositionChain = "";
		var nextDialogPositionChain = "";

		if(stateSlicesObj.selectedMessagePosition > 0)
			previousDialogPositionChain = stateSlicesObj.childDialogPositionsArr[stateSlicesObj.selectedMessagePosition-1];

		if((stateSlicesObj.selectedMessagePosition +1) < stateSlicesObj.childDialogPositionsArr.length)
			nextDialogPositionChain += stateSlicesObj.childDialogPositionsArr[stateSlicesObj.selectedMessagePosition+1];

		retHtml += "<dialogNavigation "+ 
						"domain='"+componentPropertiesObj.domain+"' " + 
						"currentDialogPositionChain='"+stateSlicesObj.childDialogPositionsArr[stateSlicesObj.selectedMessagePosition]+"' "+
						"previousDialogPositionChain='"+previousDialogPositionChain+"' "+
						"nextDialogPositionChain='"+nextDialogPositionChain+"' "+
						"></dialogNavigation>";

		retHtml += "<dialog domain='"+componentPropertiesObj.domain+"' dialogPositionChain='"+stateSlicesObj.childDialogPositionsArr[stateSlicesObj.selectedMessagePosition]+"'></dialog>";

		retHtml += "</div>";

		return retHtml;
	});

	componentObj.addStateExtractor(function(componentPropertiesObj, globalStateObj){

		var returnObj = {};

		globalStateObj = HIPI.lib.Dialogs.selectDefaultChildDialogIfNeeded(globalStateObj, componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain);

		returnObj.childDialogPositionsArr = HIPI.lib.Dialogs.getArrayOfChildDialogPositionChainsSortedByDepth(globalStateObj, componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain);

		returnObj.childDialogPositionsArr = HIPI.lib.General.filterDialogPositionChainsByUserSettings(globalStateObj, componentPropertiesObj.domain, returnObj.childDialogPositionsArr);

		// Let the HTML generator know what message is currently selected so that it can render the Next/Previous buttons accordingly.
		returnObj.selectedMessagePosition = null;

		returnObj.childDialogPositionsArr.forEach(function(loopDialogPositionChain, loopIndex){

			var loopDialogSubArr = HIPI.lib.Dialogs.getDialogPositionReference(globalStateObj, componentPropertiesObj.domain, loopDialogPositionChain);

			if(loopDialogSubArr.selected)
				returnObj.selectedMessagePosition = loopIndex;
		});

		// The reducer for GO_PERPENDICULAR should have selected a dialog before this component was instantiated.
		// This component shouldn't be generated unless the calling code knows that at least one child dialog exists.
		if(returnObj.selectedMessagePosition === null)
			throw new Error("Error in <dialogSorter> state extractor. Could not find a selected dialog position.");

		return returnObj;
	});

	HIPI.framework.ComponentCollection.addComponent(componentObj);
});
