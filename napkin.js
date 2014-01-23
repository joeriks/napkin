var fs = require("fs");
var napkinparser = require("./napkinparser");

console.log("v 0.045");

function repeat(pattern, count) {
    if (count < 1)
        return '';
    var result = '';
    while (count > 0) {
        if (count & 1)
            result += pattern;
        count >>= 1, pattern += pattern;
    }
    return result;
}

function genericprocessor(pre, hasChildren, post) {
    var buffer = "";
    var write = function (text) {
        buffer += text;
    };

    var pr = function (nodeOrNodes, level) {
        var tabs = repeat("\t", level);

        var node = {};

        if (typeof level == "undefined") {
            node.children = nodeOrNodes;
            node.isRoot = true;
            node.node = "{root}";
            level = -1;
        } else {
            node = nodeOrNodes;
        }

        if (!node.isRoot)
            pre({ level: level, node: node, tabs: tabs, write: write });

        if (typeof hasChildren == "undefined" || hasChildren == null)
            hasChildren = function () {
                return (node.children);
            };

        if (hasChildren({ level: level, node: node, tabs: tabs, write: write })) {
            for (var i in node.children) {
                pr(node.children[i], level + 1);
            }
        }

        if (!node.isRoot && typeof post != "undefined")
            post({ level: level, node: node, tabs: tabs, write: write });
    };

    return function (nodes) {
        buffer = "";
        pr(nodes);
        return buffer;
    };
}

var generateTags = genericprocessor(function (pr) {
    var atts = [];
    if (pr.node.attributes) {
        for (var i in pr.node.attributes) {
            var attr = pr.node.attributes[i];
            var key = Object.keys(attr)[0];
            var value = attr[key];
            atts.push(key + "=" + "\"" + value + "\"");
        }
    }
    var attrs = "";
    if (atts.length > 0)
        attrs = " " + atts.join(" ");

    pr.write(pr.tabs + "<node name=\"" + pr.node.node + "\"" + attrs + ">\n");
}, null, function (pr) {
    pr.write(pr.tabs + "</node>\n");
});

var generateText = genericprocessor(function (pr) {
    function stringIfNeeded(s) {
        if (s.indexOf(" ") != -1 || s.indexOf("\n") != -1) {
            return "\"" + s + "\"";
        }
        return s;
    }

    var atts = [];
    if (pr.node.attributes) {
        for (var i in pr.node.attributes) {
            var attr = pr.node.attributes[i];
            var key = Object.keys(attr)[0];
            var value = stringIfNeeded(attr[key]);

            if (key == "attr")
                atts.push(value);
            else
                atts.push(key + "=" + value + "");
        }
    }

    var attrs = "";
    if (atts.length > 0)
        attrs = " " + atts.join(" ");

    pr.write(pr.tabs + stringIfNeeded(pr.node.node) + attrs + "\n");
}, null, function (pr) {
});

var generateCs = genericprocessor(function (pr) {
    var atts = [];
    if (pr.node.attributes) {
        for (var i in pr.node.attributes) {
            var attr = pr.node.attributes[i];
            var key = Object.keys(attr)[0];
            var value = attr[key];

            if (key == "attr")
                atts.push(value);
            else
                atts.push(key + "=" + value);
        }
    }

    var attrs = "";
    if (atts.length > 0)
        attrs = " " + atts.join(" ");

    if (pr.level == 0) {
        if (pr.node.node.indexOf("_") != 0)
            pr.write(pr.tabs + "namespace " + pr.node.node + " {\n");
    }

    if (pr.level == 1) {
        if (pr.node.node.indexOf("_") != 0)
            pr.write(pr.tabs + "public class " + pr.node.node + " {\n");
    }

    if (pr.level == 2) {
        var type = "string";
        if (atts.length > 0) {
            type = atts[0];
            if (atts[0] == "i")
                type = "int";
        }

        if (pr.node.children) {
            for (var ch in pr.node.children) {
                pr.write(pr.tabs + "[Description(\"" + pr.node.children[ch].node + "\")]\n");
            }
        }

        pr.write(pr.tabs + "public " + type + " " + pr.node.node + " {get;set;}\n");
    }
}, function (pr) {
    if ((pr.node.children) && pr.node.node.indexOf("_") != 0)
        return true;
    return false;
}, function (pr) {
    if (pr.level == 0 || pr.level == 1) {
        if (pr.node.node.indexOf("_") != 0)
            pr.write(pr.tabs + "}\n");
    }
});

function processAll(array) {
    processArray(array, array, null, [], processIteratedItem);
}

function processArray(fullarray, childarray, parentNode, position, iteratorCallback) {
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
function splitHeadTail(name, char) {
    var firstDot = name.indexOf(char);

    if (firstDot == -1) {
        return { head: name, tail: "" };
    }
    ;
    return { head: name.substring(0, firstDot), tail: name.substring(firstDot + 1) };
}
function findChild(array, findChildName, callback) {
    var find = splitHeadTail(findChildName, ".");

    var found = false;

    for (var i in array) {
        var lookAtNode = array[i];
        if (lookAtNode.node == find.head) {
            if (find.tail != "") {
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

        if (position.length == 1 && find == "") {
            var headTail = splitHeadTail(findChildName, ".");

            if (itm.node == headTail.head && headTail.tail == "_") {
                for (var i in itm.children) {
                    callback(fullarray, itm.children[i], true);
                }
            }
            if (itm.node == headTail.head && headTail.tail == "") {
                callback(fullarray, itm, true);
            }

            if (itm.node == headTail.head && headTail.tail != "" && headTail.tail != "") {
                found = true;
                findChildName = headTail.tail;
            }
        }

        if (found) {
            if (findChildName == "") {
                callback(fullarray, itm, false);
            } else {
            }

            findChild(itm.children, findChildName, function (founditm, addAsChild) {
                callback(fullarray, founditm, addAsChild);
            });
        }
    };
}
;

function processIteratedItem(fullarray, position, itemToProcess, parentNode) {
    if (itemToProcess.node.substring(0, 1) == "=") {
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
            var foundCallback = function (array, foundItem, addAsChild) {
                if (addAsChild) {
                    itemToProcess["replaceWithChildren"] = true;

                    if (!(itemToProcess.children)) {
                        itemToProcess.children = [];
                    }

                    itemToProcess.children.push(foundItem);
                } else {
                    itemToProcess.node = foundItem.node;

                    if (foundItem.children) {
                        if (!(itemToProcess.children)) {
                            itemToProcess.children = [];
                        }
                        itemToProcess.children = itemToProcess.children.concat(foundItem.children);
                    }
                    if (foundItem.attributes) {
                        if (!(itemToProcess.attributes)) {
                            itemToProcess.attributes = [];
                        }
                        itemToProcess.attributes = itemToProcess.attributes.concat(foundItem.attributes);
                    }
                }

                itemToProcess["processed"] = param;
            };

            var findIterator = createFindIterator(fullarray, findAt, childName, foundCallback);

            processArray(fullarray, fullarray, itemToProcess, [], findIterator);
        }
    }
}

function generate(param) {
    var options;

    if (typeof param == "string")
        options = { infile: param };
    else
        options = param;

    var infile = (options.infile);

    var textToParse;

    if (options.textToParse)
        textToParse = options.textToParse;
    else
        textToParse = fs.readFileSync(infile, "utf8").replace(/^\uFEFF/, '');

    var parser = napkinparser;
    var parsed = parser.parse(textToParse);

    if (parsed.commands) {
        var commands = parsed.commands.splice(0);

        for (var c in commands) {
            var cmd = commands[c];

            if (cmd.type == "include" || cmd.type == "reference") {
                var filename = cmd.attributes[0].attr;

                var included = generate(filename);

                if (included) {
                    var arr = [];
                    for (var i = 0; i < included.length; i++) {
                        var item = included[i];

                        item["included"] = cmd.type;

                        arr.push(item);
                    }

                    parsed.model = arr.concat(parsed.model);
                }
            }

            if (cmd.type == "map") {
                var filename = cmd.attributes[0].attr;

                var req = require("./" + filename);
                parsed.model = req(parsed.model);
            }

            if (cmd.type == "processall") {
                processAll(parsed.model);
            }

            if (cmd.type == "out") {
                if (cmd.attributes && cmd.attributes.length > 1) {
                    var filename = cmd.attributes[0].attr;
                    var type = cmd.attributes[1].attr;

                    if (!parsed.processed) {
                        parsed.processed = parsed.model.slice(0);
                        processAll(parsed.processed);

                        var newChildArray = [];
                        for (var ii in parsed.processed) {
                            if (!(parsed.processed[ii]["included"] && parsed.processed[ii]["included"] == "reference")) {
                                newChildArray.push(parsed.processed[ii]);
                            }
                        }

                        parsed.processed = newChildArray;
                    }

                    if (type == "text") {
                        var formatted = generateText(parsed.processed);
                        fs.writeFileSync(filename, formatted);
                        console.log("Created " + filename);
                    }
                    if (type == "xml") {
                        var formatted = generateTags([{ node: "root", children: parsed.processed }]);
                        fs.writeFileSync(filename, formatted);
                        console.log("Created " + filename);
                    }
                    if (type == "json") {
                        fs.writeFileSync(filename, JSON.stringify(parsed.processed, null, "  "));
                        console.log("Created " + filename);
                    }
                    if (type == "cs") {
                        var formatted = generateCs(parsed.processed);
                        fs.writeFileSync(filename, formatted);
                        console.log("Created " + filename);
                    }
                    if (type == "jsonraw") {
                        fs.writeFileSync(filename, JSON.stringify(parsed, null, "  "));
                        console.log("Created " + filename);
                    }
                }
            }
        }

        console.log("Finished " + options.infile);
        return parsed.model;
    }
}

module.exports = {
    generate: generate,
    parser: napkinparser,
    asTags: generateTags,
    asText: generateText
};
