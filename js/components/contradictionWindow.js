"use strict";
postInit(function(){

	var componentObj = new HIPI.framework.Component();

	componentObj.defineHtmlElementSelector("contradictionWindow");
	componentObj.defineComponentPropName("domain");
	componentObj.defineComponentPropName("dialogPositionChain");
	componentObj.defineComponentPropName("contradictionPositionChain");

	componentObj.addHtmlGenerator(function(elementIdOfComponentInstanceWrapper, componentPropertiesObj, stateSlicesObj){

		if(HIPI.lib.Contradictions.isContradictionLevelSkeptical(componentPropertiesObj.contradictionPositionChain)){

			var closeButtonText = ")-:";
			var closeButtonTitle = "Concede and close this offensive contradiction window. \nContradictions at odd levels aim to contradict the underlying dialog.";
			var wrapperClassName = "skeptical-contradiction";
		}
		else{

			var closeButtonText = ":-)";
			var closeButtonTitle = "Concede and close this defensive contradiction window. \nContradictions at even levels support the underlying dialog.";
			var wrapperClassName = "trusting-contradiction";
		}

		var retHtml = "<div class='contradiction-window "+wrapperClassName+"'>" +
						"<button class='btn-close-contradiction-window' title='"+closeButtonTitle+"' id='btn-close-contradiction-window"+elementIdOfComponentInstanceWrapper+"'>"+closeButtonText+"</button>";

			if(stateSlicesObj.isContradicted){

				retHtml += "<h2>Restore / Un-Contradict</h2>" +
							"<div>To restore the state back to true you will need to contradict the current contradiction. A target cannot be invalidated by more than one Contradiction at a time because it would welcome brute force attacks comprised of gibberish content instead of thoughtful and convincing arguments.</div>" +
							"<h3>Current Contradiction</h3>" +
							"<div class='defeated-contradiction-row'>" +
								"<div><div class='contradiction-part-label-you-cant'>You can't say...</div> <div class='highlight-cant-text'>"+HIPI.framework.Utilities.htmlizeStringWithLineBreaks(stateSlicesObj.contradictionCant)+"</div></div>" +
								"<div><div class='contradiction-part-label-because'>Because...</div> <div class='highlight-cuz-text'>"+HIPI.framework.Utilities.htmlizeStringWithLineBreaks(stateSlicesObj.contradictionBecause)+"</div></div>" +
							"</div>" +
							"<button id='btn-contradict-contradiction"+elementIdOfComponentInstanceWrapper+"'>Contradict</button>";
			}
			else{

				retHtml += "<newContradictionTabs domain='"+componentPropertiesObj.domain+"' dialogPositionChain='"+componentPropertiesObj.dialogPositionChain+"' contradictionPositionChain='"+componentPropertiesObj.contradictionPositionChain+"'></newContradictionTabs>";
			}

			if(stateSlicesObj.showContradictWindow)
				retHtml += "<contradictionWindow domain='"+componentPropertiesObj.domain+"' dialogPositionChain='"+componentPropertiesObj.dialogPositionChain+"' contradictionPositionChain='"+stateSlicesObj.positionChainWhichContrdictsStr+"'></contradictionWindow>";

		retHtml += "</div>";

		return retHtml;
	});

	componentObj.addStateExtractor(function(componentPropertiesObj, globalStateObj){

		var retObj = {};

		retObj.isContradicted = HIPI.lib.Contradictions.isTargetContradicted(globalStateObj, componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain, componentPropertiesObj.contradictionPositionChain);

		if(retObj.isContradicted){

			retObj.positionChainWhichContrdictsStr = HIPI.lib.Contradictions.getContradictionPositionChainWhichHasInvalidatedTheTarget(globalStateObj, componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain, componentPropertiesObj.contradictionPositionChain);

			var contradictionRef = HIPI.lib.Contradictions.getContradictionPositionReference(globalStateObj, componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain, retObj.positionChainWhichContrdictsStr);

			retObj.contradictionCant = contradictionRef.cant;
			retObj.contradictionBecause = contradictionRef.because;

			// Show a new Contradiction window addressing the Contradiction which has contradicted the current target.
			var contradictionTargetRef = HIPI.lib.Contradictions.getContradictionPositionReference(globalStateObj, componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain, retObj.positionChainWhichContrdictsStr);

			retObj.showContradictWindow = contradictionTargetRef.showContradictWindow ? true : false;
		}

		return retObj;
	});

	componentObj.addDomBindRoutine(function(elementIdOfComponentInstanceWrapper, componentPropertiesObj, stateSlicesObj){

		document.getElementById("btn-close-contradiction-window"+elementIdOfComponentInstanceWrapper).addEventListener("click", function(){

			HIPI.state.ActionMethods.hideContradictWindow(componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain, componentPropertiesObj.contradictionPositionChain);

			return false;
		});

		var contradictButtonElem = document.getElementById("btn-contradict-contradiction"+elementIdOfComponentInstanceWrapper);
		if(contradictButtonElem){

			contradictButtonElem.addEventListener("click", function(){

				HIPI.state.ActionMethods.showContradictWindow(componentPropertiesObj.domain, componentPropertiesObj.dialogPositionChain, stateSlicesObj.positionChainWhichContrdictsStr, null);

				return false;
			});
		}
	});

	HIPI.framework.ComponentCollection.addComponent(componentObj);
});
