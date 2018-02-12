"use strict";
postInit(function(){

	HIPI.framework.AppState.addReducerFunction(function(stateObj, actionObj){

		HIPI.framework.Utilities.ensureTypeObject(stateObj);
		HIPI.framework.Utilities.ensureValidActionObject(actionObj);

		switch(actionObj.type){
			case HIPI.state.ActionNames.INITIALIZE_STORE :
				
				for(var i=0; i<stateObj.domains.length; i++){

					// Cache the contradicted status for all entries in the database when the application first starts.
					// This could take a while, it's not safe to persist these attributes to the server and trust.
					if(stateObj.domains[i].dialogs){
						
						for(var j=0; j<stateObj.domains[i].dialogs.length; j++)
							stateObj = HIPI.lib.Contradictions.cacheContradictionStatusesOfDialogDecendantsAndContradictions(stateObj, stateObj.domains[i].domainName, j.toString());
					}

					stateObj = HIPI.lib.Dialogs.cacheDialogDepths(stateObj, stateObj.domains[i].domainName, "", false);
					stateObj = HIPI.lib.Dialogs.cacheAnsweredStatus(stateObj, stateObj.domains[i].domainName, "", false);
				}

				break;
		}

		return stateObj;
	});

});
