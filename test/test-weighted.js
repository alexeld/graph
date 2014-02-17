var assert = require('assert'),
    Graph  = require('../lib/Graph');

describe('weighted graph-specific tests', function () {

    it('should be able to create a simple weighted graph', function () {

        var g = new Graph({
            nodes: [ { name: 'A' }, { name: 'B' } ],
            edges: [ 
                { name: 'A->B', from: 'A', to: 'B', weight: 10 }
            ]
        }, true);

        // Check that the weight between 'A' and 'B' is 10.
        assert(g.findPath('A', 'B') === 10);
    });

    it('should be create a weighted graph for truthy values', function () {

        [ {}, true, [], 'foo', 1, -1, 100 ].forEach( function (truth) {

            var g = new Graph({
                nodes: [ { name: 'A' }, { name: 'B' } ],
                edges: [ 
                    { name: 'A->B', from: 'A', to: 'B', weight: 10 }
                ]
            }, truth);

            // Check that the weight between 'A' and 'B' is 10.
            assert(g.findPath('A', 'B') === 10);
        });
    });

    it('should not use weights for any falsy value', function () {

        [ false, '', null, undefined ].forEach( function (falsy) {

            var g = new Graph({
                nodes: [ { name: 'A' }, { name: 'B' } ],
                edges: [ 
                    { name: 'A->B', from: 'A', to: 'B', weight: 10 }
                ]
            }, falsy);

            // Check that the weight between 'A' and 'B' is 10.
            assert(g.findPath('A', 'B') === -1);
        });
    });

    it('should support user-defined cost functions', function () {

        var weight_calc = {

            calculator: function (edge) {
                assert(true);
                edge = (edge instanceof Array) ? edge[0] : edge;
                return (edge.weight.age + 2) + edge.weight.height;
            }
        };

        var g = new Graph({
            nodes: [ { name: 'A' }, { name: 'B' } ],
            edges: [ 
                { 
                    name: 'A->B', 
                    from: 'A', to: 'B', 
                    weight: { age: 3, height: 5 }
                }
            ]
        }, weight_calc); // <-- object containing the special 'calculator' fn

        assert(g.findPath('A', 'B') === 10);
    });
});
