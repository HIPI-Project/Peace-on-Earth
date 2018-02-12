# The Human Intelligence Protocol Interface
The HIPI is local application that runs in the web browser.  It's been modeled around the Intelligence Algorithm which facilitates collaboration by means of 2-way dialog and contradiction avoidance.  Please launch the application to continue reading about how to use it and to understand why it's a game-changer.

The HIPI has no dependencies, beyond Node.js, and doesn't make network calls outside of "localhost".  The database is simply a flat file encoded in JSON format which means that contributions must be merged, either with version control software (i.e. Git, SVN, etc.) or by using manual difference/merging tools. 

## Installation
* Download and install Node.js.
    * Go to the [Node.js website](https://nodejs.org/en/download/) and pick the appropriate installer.
    * Installation will require administrator privileges.
    * To ensure Node.js has been installed, run `node -v` in the terminal.  Expect an output that looks something like "v6.9.5".
* Clone this repository or download/unzip into a folder of your choosing.
* Navigate to the folder containing the application and run the following command in the terminal. `npm start` 
* After starting the node process you should receive a message such as "Server running at http://127.0.0.1:2828/"
* Copy and paste the web address into your favorite web browser.