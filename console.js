/*!
 *  Console.js
 *  JavaScript library that overrides the console object bringing its functionality in a DOM element.
 *
 *  Check out the project repository on GitHub: https://github.com/IonicaBizau/console.js
 *  This code is licensed with <3 under The KINDLY License.
 * */
(function (root) {

    // Save all methods in this object
    var OldConsole = {};

    // In case console is not an object, we silently do nothing
    if (typeof console !== "object") {
        return;
    }

    /*!
     * generateNewMethod
     * Generates a method which overrides the current method.
     *
     * @name generateNewMethod
     * @function
     * @param {String} method The method to override.
     * @return {Function} The overriding function.
     */
    function generateNewMethod(method) {
        return function () {

            // Call the old method
            OldConsole[method].apply(console, arguments);

            // These are the supported methods. The good thing is that I accept contributions! :-)
            if (["debug", "log", "info", "warn", "error", "dir"].indexOf(method) === -1) {
                return;
            }

            // each DOM reference where the message must be appended
            for (var i = 0; i < _consoleJS._els.length; ++i) {

                var cEl = _consoleJS._els[i]
                  , htmlToSet = ""
                  , lineSeparator = "<br />"
                  ;

                // <pre> elements have "\n" line separators
                if (cEl.tagName === "PRE") {
                    lineSeparator = "\n";
                }

                // Create a new span for this message
                var nSpan = document.createElement("span");
                nSpan.className += method;

                // Stringify the arguments
                for (var i = 0; i < arguments.length; ++i) {
                    htmlToSet += JSON.stringify(
                        arguments[i]
                      , null
                      , method === "dir"
                      ? 4 : undefined
                    ) + " ";
                }

                // Append the line separator
                htmlToSet += lineSeparator;

                // Set the content
                if (nSpan.innerText) {
                    nSpan.innerText = htmlToSet;
                } else {
                    nSpan.textContent = htmlToSet;
                }

                // Append the new message
                cEl.appendChild(nSpan);
            }
        }
    }

    /*!
     * overrideMethod
     * Overrides a method.
     *
     * @name overrideMethod
     * @function
     * @param {String} method The method to be overriden.
     */
    function overrideMethod(method) {
        // save the current method in the OldConsole object
        OldConsole[method] = console[method]

        // replace the old method with a new function
        console[method] = generateNewMethod(method);
    }

    /*!
     * ConsoleJS
     * Creates a new instance of `ConsoleJS`.
     *
     * @name ConsoleJS
     * @function
     * @return {ConsoleJS} The `ConsoleJS` instance.
     */
    function ConsoleJS() {
        this._els = [];
        this._history = [];
        this._current = -1;
    }

    /**
     * ConsoleJS.init
     * Adds a new element where the console will show the output.
     *
     * @name ConsoleJS.init
     * @function
     * @param {Object} options The DOM element (or query selector) or an object
     * containing the following fields:
     *
     *  - selector (String|HTMLElement): The DOM element or query selector.
     *  - input (String|HTMLElement): The DOM element or query selector. This
     *    is the element where the user inputs the code (could be a `textarea`,
     *    `input` or so).
     */
    ConsoleJS.prototype.init = function (options) {

        var self = this;

        // Override methods
        for (var method in console) {
            overrideMethod(method);
        }

        options = options || {};
        if (typeof options !== "object") {
            options = {
                selector: options
            };
        }

        // Selector was not provided
        if (!options.selector) {
            throw new Error ("options.selector is required");
        }

        // Get all elements
        if (typeof options.selector === "string") {
            self._els = document.querySelectorAll(options.selector);
        }

        // Handle input
        if (options.input) {

            if (typeof options.input === "string") {
                options.input = document.querySelector(options.input);
            }

            // Keyup handler for this textarea
            options.input.focus();
            options.input.addEventListener("keydown", function (e) {

                if (e.keyCode === 38 && e.ctrlKey) {
                    this.value = self.history.back().command;
                    return;
                }

                if (e.keyCode === 40 && e.ctrlKey) {
                    this.value = _consoleJS.history.next().command;
                    return;
                }

                // Not enter or shift is pressed
                if (e.keyCode !== 13 || e.shiftKey) { return; }

                self._history.push({
                    command: this.value
                  , date: new Date()
                });

                self._current = self._history.length;

                try {
                    console.log(eval(this.value));
                } catch (e) {
                    console.error(e.message);
                }

                this.value = "";

                e.preventDefault();
            });
        }
    };

    ConsoleJS.prototype.history = {};

    /**
     * ConsoleJS.back
     * Goes back in the history.
     *
     * @name ConsoleJS.back
     * @function
     * @return {Object} An object containing the `command` field.
     */
    ConsoleJS.prototype.history.back = function () {
        var res = _consoleJS._history[--_consoleJS._current];
        if (res === undefined) {
            ++_consoleJS._current;
            res = { command: "" };
        }
        return res;
    };

    /**
     * ConsoleJS.next
     * Goes to the next command in the history.
     *
     * @name ConsoleJS.next
     * @function
     * @return {Object} An object containing the `command` field.
     */
    ConsoleJS.prototype.history.next = function () {
        var res = _consoleJS._history[++_consoleJS._current];
        if (res === undefined) {
            --_consoleJS._current;
            res = { command: "" };
        }
        return res;
    };

    var _consoleJS = new ConsoleJS();

    // Export the ConsoleJS instance
    window.ConsoleJS = _consoleJS;
})(this);