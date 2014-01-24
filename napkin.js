console.log("v 0.051");

var fs = require("fs");
var napkinparser = require("./napkinparser");
var traverse = require("traverse");

function processAll(array) {
    processArray(array, array, null, [], processIteratedItem);
}

function processArray(fullarray, childarray, parentNode, position, iteratorCallback) {
    //if (parentNode) console.log(parentNode.node);
    var localposition = 0;
    for (var i in childarray) {
        var currentNode = childarray[i];

        var position2 = function () {
            var copy = position.slice(0);
            copy.push(localposition);
            return copy;
        }();

        iteratorCallback(fullarray, position2, currentNode, parentNode);

        if (currentNode.children) {
            currentNode.children = processArray(fullarray, currentNode.children, currentNode, position2, iteratorCallback);
        }

        localposition++;
    }

    var newChildArray = [];
    for (var ii in childarray) {
        if (childarray[ii]["replaceWithChildren"]) {
            for (var iii in childarray[ii].children) {
                newChildArray.push(childarray[ii].children[iii]);
            }
        } else {
            newChildArray.push(childarray[ii]);
        }
    }

    childarray = newChildArray;
    return newChildArray;
}

function findChild(array, findChildName, callback) {
    var find = splitHeadTail(findChildName, ".");

    var found = false;

    for (var i in array) {
        //console.log("looking at " + array[i].node + " for " + find.head);
        var lookAtNode = array[i];
        if (lookAtNode.node == find.head) {
            //console.log("Found head " + find.head + " now looking for " + ((find.tail) ? find.tail : "attributes"));
            if (find.tail != "") {
                //console.log("found, continuing");
                var children = lookAtNode.children;
                if (children)
                    if (find.tail != "_") {
                        findChild(children, find.tail, callback);
                    } else {
                        for (var ii in children) {
                            var child = children[ii];
                            callback(children[ii], true);
                        }
                    }
            } else {
                //console.log("found");
                //console.log(array[i]);
                callback(lookAtNode, false);
            }
        }
    }
}
;

function createFindIterator(fullarray, findAt, findChildName, callback) {
    return function (fullarray, position, itm) {
        var pos = position.join(",");
        var find = findAt.join(",");

        var found = (pos === find);

        //console.log("looking at " + pos + " for " + find + " and name " + findChildName);
        if (position.length == 1 && find == "") {
            // top level search
            var headTail = splitHeadTail(findChildName, ".");

            //console.log("same level lookup for " + headTail.head);
            //console.log("checking " + itm.node);
            if (itm.node == headTail.head && headTail.tail == "_") {
                for (var i in itm.children) {
                    callback(fullarray, itm.children[i], true);
                }
            }
            if (itm.node == headTail.head && headTail.tail == "") {
                // add as child
                callback(fullarray, itm, true);
            }

            if (itm.node == headTail.head && headTail.tail != "" && headTail.tail != "") {
                found = true;
                findChildName = headTail.tail;
            }
            //    if (itm.node == headTail.head) {
            //        found = true;
            //        findChildName = headTail.tail;
            //    }
            //    if (headTail.tail = "_") {
            //        found = true;
            //        findChildName = "_";
            //    }
        }

        if (found) {
            //console.log("found parent " + itm.node + ((findChildName) ? " now looking for " + findChildName : ""));
            if (findChildName == "") {
                callback(fullarray, itm, false);
            } else {
                //console.log("Calling find child");
            }

            findChild(itm.children, findChildName, function (founditm, addAsChild) {
                //console.log("Add as child" + addAsChild);
                callback(fullarray, founditm, addAsChild);
            });
        }
    };
}
;

function processIteratedItem(fullarray, position, itemToProcess, parentNode) {
    // process iterated item
    if (itemToProcess.node.substring(0, 1) == "=") {
        // command found at iterated item
        //console.log("processing " + itemToProcess.node);
        var count = 0;

        var findAt = position.slice(0);
        findAt.pop();

        var param = itemToProcess.node.substring(1);
        for (var i = 0; i < param.length; i++) {
            if (param.substring(i, i + 1) == ".") {
                count++;
                findAt.pop();
            } else
                break;
        }

        var childName = param.substring(count);

        if (count > 0) {
            //console.log("find " + findAt.join(",") + " " + childName);
            var foundCallback = function (array, foundItem, addAsChild) {
                //console.log(foundItem);
                if (addAsChild) {
                    //console.log("Adding found node as child");
                    itemToProcess["replaceWithChildren"] = true;

                    if (!(itemToProcess.children)) {
                        //console.log("Adding children element");
                        itemToProcess.children = [];
                    }

                    itemToProcess.children.push(foundItem);
                } else {
                    itemToProcess.node = foundItem.node;

                    //console.log("Setting children and attributes from found node");
                    if (foundItem.children) {
                        if (!(itemToProcess.children)) {
                            //console.log("Adding children element");
                            itemToProcess.children = [];
                        }
                        itemToProcess.children = itemToProcess.children.concat(foundItem.children);
                    }
                    if (foundItem.attributes) {
                        if (!(itemToProcess.attributes)) {
                            //console.log("Adding attributes element");
                            itemToProcess.attributes = [];
                        }
                        itemToProcess.attributes = itemToProcess.attributes.concat(foundItem.attributes);
                    }
                }

                itemToProcess["processed"] = param;
            };

            var findIterator = createFindIterator(fullarray, findAt, childName, foundCallback);

            //console.log("find referenced node");
            //console.log("Now iterating");
            processArray(fullarray, fullarray, itemToProcess, [], findIterator);
        }
    }
}

function splitHeadTail(name, char) {
    var firstDot = name.indexOf(char);

    if (firstDot == -1) {
        return { head: name, tail: "" };
    }
    ;
    return { head: name.substring(0, firstDot), tail: name.substring(firstDot + 1) };
}

function generate(objectToParse, type) {
    for (var g in exports.generators) {
        var generator = exports.generators[g];

        if (generator.type == type) {
            return generator.generatorFunction(objectToParse);
        }
    }

    console.log("Generator not found " + type + " did you miss to install it (i.e. require('napkin-generator-" + type + "')?");

    return JSON.stringify(objectToParse, null, "  ");
}
exports.generate = generate;

function runCommands(objectToParse) {
    function cmd_include(filename) {
        var included = exports.parseFile(filename, false);

        if (included) {
            var arr = [];
            for (var i = 0; i < included.length; i++) {
                var item = included[i];

                item["included"] = cmd.type;

                arr.push(item);
            }

            objectToParse.model = arr.concat(objectToParse.model);
        }
    }

    function cmd_map(filename) {
        var req = require("./" + filename);
        objectToParse.model = req(objectToParse.model);
    }

    function cmd_out(filename, type) {
        if (!objectToParse.processed) {
            objectToParse.processed = objectToParse.model.slice(0);
            processAll(objectToParse.processed);

            var newChildArray = [];
            for (var ii in objectToParse.processed) {
                if (!(objectToParse.processed[ii]["included"] && objectToParse.processed[ii]["included"] == "reference")) {
                    newChildArray.push(objectToParse.processed[ii]);
                }
            }

            objectToParse.processed = newChildArray;
        }

        var formatted = exports.generate(objectToParse, type);
    }

    if (objectToParse.commands) {
        var commands = objectToParse.commands.splice(0);

        for (var c in commands) {
            var cmd = commands[c];

            if (cmd.type == "include" || cmd.type == "reference")
                cmd_include(cmd.attributes[0].attr);

            if (cmd.type == "map")
                cmd_map(cmd.attributes[0].attr);

            if (cmd.type == "processall")
                processAll(objectToParse.model);

            if (cmd.type == "out")
                cmd_out(cmd.attributes[0].attr, (cmd.attributes.length > 1) ? cmd.attributes[1].attr : "text");
        }
    }

    return objectToParse;
}

function parseString(textToParse, doRunCommands) {
    var parsed = napkinparser.parse(textToParse);

    if (doRunCommands)
        runCommands(parsed);

    return parsed.model;
}
exports.parseString = parseString;

function parseFile(filename, doRunCommands) {
    var textToParse = fs.readFileSync(filename, "utf8").replace(/^\uFEFF/, '');

    return exports.parseString(textToParse, doRunCommands);
}
exports.parseFile = parseFile;

exports.generators = [];

function addGenerator(type, generatorFunction) {
    exports.generators.push({ type: type, generatorFunction: generatorFunction });

    console.log("Added generator for Napkin: " + type);
}
exports.addGenerator = addGenerator;
