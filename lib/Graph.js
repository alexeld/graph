var util = require('util'),
    _    = require('lodash');

var JSV = require('JSV').JSV;
var validator = JSV.createEnvironment();

var schema = require('../schema/graph.json');

function GraphStructureValidationError(message, errors) {
    Error.call(this);
    this.errors = errors;
}

util.inherits(GraphStructureValidationError, Error);


// Helper function that checks that field `fieldName` is
// unique amongst all array `arr` members.
// returns array of `fieldName` values that are doubled.
// If check is successful, return array will be zero
function fieldsAreUnique(arr, fieldName) {
    var hash = {};
    var doubles = {};

    arr.forEach(function (item) {
        var value = item[fieldName];
        if (hash[value]) {
            doubles[value] = 1;
        } else {
            hash[value] = 1;
        }
    });

    return Object.keys(doubles);
}

// Helper function that checks that all edges pointing to
// existent nodes (no "hanging" edges).
// returns array of invalid edges.
// First argument is a graph instance variable (to be able to use `.getNode()` method).
function findHangingEdges(graph, edges) {
    var errorEdges = [];
    edges.forEach(function (edge) {
        var fromNode = graph.getNode(edge.from);
        var toNode = graph.getNode(edge.to);
        if (!fromNode || !toNode) {
            errorEdges.push(edge);
        }
    });
    return errorEdges;
}

function Graph(structure, directed, weighted) {
    if (!structure) {
        return new GraphStructureValidationError('Graph constructor should be provided with structure argument');
    }

    var report = validator.validate(structure, schema);
    if (report.errors.length > 0) {
        return new GraphStructureValidationError('Error validation graph structure on creation', report.errors);
    }

    var nodeNamesDoubles = fieldsAreUnique(structure.nodes, 'name');
    if (nodeNamesDoubles.length !== 0) {
        return new GraphStructureValidationError('Node names must be unique', nodeNamesDoubles);
    }
    this.nodes = structure.nodes;

    var edgeNamesDoubles = fieldsAreUnique(structure.edges, 'name');
    if (edgeNamesDoubles.length !== 0) {
        return new GraphStructureValidationError('Edge names must be unique', edgeNamesDoubles);   
    }
    var hangingEdges = findHangingEdges(this, structure.edges);
    if (hangingEdges.length !== 0) {
        return new GraphStructureValidationError('Edges must point to existing nodes', hangingEdges);
    }


    if ( typeof weighted !== 'undefined' && weighted ) {

        this._weighted = true;
        this._distance_lookup = [];

        if ( weighted.hasOwnProperty('calculator') ) {
            if ( typeof weighted.calculator === 'function' ) {
                this._calculateWeightCallback = weighted.calculator;
            }
        }
    }
    else {
        this._weighted = false;
    }

    this.edges     = structure.edges;
    this.directed = directed;
    this._INFINITY = -1;
    this._buildDistanceLookup();
}

// Looks for node by name
Graph.prototype.getNode = function (name) {
    return (
        this.nodes.filter(function (node) {
            return node.name === name;
        })[0]
    );
};

// Looks for edge by name
Graph.prototype.getEdge = function (name) {

    return (
        this.edges.filter(function (edge) {
            return edge.name === name;
        })[0]
    );
};

// Gets outbound edges from node.
// Supports both node names and node object as argument.
Graph.prototype.outboundEdges = function (node) {

    var _node  = (typeof node === 'string') ? this.getNode(node) : node;
    var _edges = this.edges.filter(function (edge) {
            return edge.from === _node.name;
    });

    //if ( ! this.directed ) {
        return _edges;
    //}

    // Must be a nicer way of doing this...
    /*this.inboundEdges(node).forEach( function (inbound_edge) {
        _edges.push(inbound_edge);
    });*/

    return _edges;
};

// Gets inbound edges from node.
// Supports both node names and node object as argument.
Graph.prototype.inboundEdges = function (node) {
    var _node = (typeof node === 'string') ?
                this.getNode(node) :
                node;
    return (
        this.edges.filter(function (edge) {
            return edge.to === _node.name;
        })
    );
};

Graph.prototype._buildDistanceLookup = function () {

    var distance_lookup = {};

    // Start at the first node
    this.nodes.forEach( function (node) {

        if ( distance_lookup.hasOwnProperty(node.name) ) return;

        distance_lookup[node.name] = [];

        this.outboundEdges(node).forEach( function (route) {
            var dist = {};
            dist[route.to] = this._calculateWeight(route);
            distance_lookup[node.name].push(dist);
        }, this);
    }, this);

    console.log(distance_lookup);

    return distance_lookup;
};

Graph.prototype._calculateWeight = function (edge) {

    if ( this.hasOwnProperty('_calculateWeightCallback') &&
            typeof this._calculateWeightCallback === 'function' ) {
        return this._calculateWeightCallback(edge);
    }

    if ( edge instanceof Array ) {
        return edge[0].weight;
    }

    return edge.weight;
};

Graph.prototype.findPath = function (from, to) {

    if ( this._weighted === false ) {
        return this._INFINITY;
    }

    var _from = (typeof from === 'string') ? this.getNode(from) : from,
        _to   = (typeof to   === 'string') ? this.getNode(to)   : to;

    // FIXME
};



// Checks, if this node is terminal, i.e. no outbound edges
Graph.prototype.isTerminalNode = function (node) {
    return this.outboundEdges(node).length === 0;
};

Graph.errors = {
    GraphStructureValidationError: GraphStructureValidationError
};

module.exports = Graph;
