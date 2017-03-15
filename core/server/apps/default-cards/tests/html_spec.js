var should = require('should'), // jshint ignore:line
    card = require('../cards/html'),
    SimpleDom = require('simple-dom'),
    opts;

describe('HTML card', function () {
    it('HTML Card renders', function () {
        opts = {
            env: {
                dom: new SimpleDom.Document()
            },
            payload: {
                html: '<h1>HEADING</h1><p>PARAGRAPH</p>'
            }
        };

        var serializer = new SimpleDom.HTMLSerializer([]);
        serializer.serialize(card.render(opts)).should.match('<div class="kg-card-html"><h1>HEADING</h1><p>PARAGRAPH</p></div>');
    });
    it('Plain content renders', function () {
        opts = {
            env: {
                dom: new SimpleDom.Document()
            },
            payload: {
                html: 'CONTENT'
            }
        };

        var serializer = new SimpleDom.HTMLSerializer([]);
        serializer.serialize(card.render(opts)).should.match('<div class="kg-card-html">CONTENT</div>');
    });
    it('Unbalanced HTML renders', function () {
        opts = {
            env: {
                dom: new SimpleDom.Document()
            },
            payload: {
                html: '<h1>HEADING<'
            }
        };

        var serializer = new SimpleDom.HTMLSerializer([]);
        serializer.serialize(card.render(opts)).should.match('<div><h1>HEADING&lt;</h1></div>');
    });
});
