/* global setFixtures */

'use strict';

var Model = require('../../src/js/base/model');
var Collection = require('../../src/js/base/collection');
var ColumnModelData = require('../../src/js/data/columnModel');
var Dimension = require('../../src/js/model/dimension');
var Renderer = require('../../src/js/model/renderer');
var Selection = require('../../src/js/model/selection');
var CellFactory = require('../../src/js/view/cellFactory');
var LayoutBody = require('../../src/js/view/layout/body');
var LayoutBodyTable = require('../../src/js/view/layout/bodyTable');
var SelectionLayer = require('../../src/js/view/selectionLayer');

describe('view.layout.body', function() {
    var grid, body;

    function createGridMock() {
        var mock = {
            $el: setFixtures('<div></div>'),
            options: {},
            option: function(name) {
                return this.options[name];
            },
            focusClipboard: function() {},
            showGridLayer: function() {},
            dataModel: new Collection(),
            columnModel: new ColumnModelData({
                columnModelList: [
                    {
                        title: 'c1',
                        columnName: 'c1',
                        width: 30
                    }, {
                        title: 'c2',
                        columnName: 'c2',
                        width: 40
                    }
                ]
            }),
            focusModel: new Model()
        };
        mock.dataModel.isRowSpanEnable = function() {
            return true;
        };
        mock.dimensionModel = new Dimension({
            grid: mock
        });
        mock.renderModel = new Renderer({
            grid: mock
        });
        mock.selectionModel = new Selection({
            grid: mock
        });
        mock.cellFactory = new CellFactory({
            grid: grid
        });
        return mock;
    }

    beforeEach(function() {
        grid = createGridMock();
        body = new LayoutBody({
            grid: grid
        });
    });

    afterEach(function() {
        body.destroy();
    });

    describe('initialize', function() {
        it('whichSide is default R', function() {
            expect(body.whichSide).toBe('R');
        });
    });

    describe('_getMouseMoveDistance', function() {
        it('피타고라스의 정리를 이용해 거리를 잘 구하는지 확인한다.', function() {
            var distance;

            body.mouseDownX = 10;
            body.mouseDownY = 10;
            distance = body._getMouseMoveDistance(12, 12);
            expect(distance).toBe(Math.round(Math.sqrt(8)));
        });
    });

    describe('_onMouseMove', function() {
        beforeEach(function() {
            body.mouseDownX = 10;
            body.mouseDownY = 10;
            grid.selectionModel._isAutoScrollable = function() {
                return false;
            }
        });

        describe('selection이 없을경우', function() {
            it('움직인 거리가 10보다 클 경우 selection 을 시작한다.', function() {
                body._onMouseMove({
                    pageX: 20,
                    pageY: 20
                });
                expect(grid.selectionModel.hasSelection()).toBe(true);
            });

            it('움직인 거리가 10보다 작을 경우 selection 시작하지 않는다..', function() {
                body._onMouseMove({
                    pageX: 15,
                    pageY: 15
                });
                expect(grid.selectionModel.hasSelection()).toBe(false);
            });
        });

        describe('selection이 있는 경우', function() {
            beforeEach(function() {
                grid.selectionModel.start(0, 0);
            });

            it('기존의 셀렉션을 확장한다', function() {
                spyOn(grid.selectionModel, 'updateByMousePosition');
                body._onMouseMove({
                    pageX: 15,
                    pageY: 15
                });

                expect(grid.selectionModel.updateByMousePosition).toHaveBeenCalledWith(15, 15);
            });
        });
    });

    describe('render()', function() {
        it('whichSide값과 grid.option의 scrollX, scrollY값에 따라 el의 overflow 속성을 설정한다.', function() {
            body.$el.css({
                'overflow-x': 'visible',
                'overflow-y': 'visible'
            });
            grid.options.scrollX = true;
            grid.options.scrollY = true;
            body.render();
            expect(body.$el.css('overflow-x')).toBe('visible');
            expect(body.$el.css('overflow-y')).toBe('visible');

            grid.options.scrollX = false;
            grid.options.scrollY = false;
            body.whichSide = 'L';
            body.render();
            expect(body.$el.css('overflow-x')).toBe('hidden');
            expect(body.$el.css('overflow-y')).not.toBe('hidden');

            body.whichSide = 'R';
            body.render();
            expect(body.$el.css('overflow-y')).toBe('hidden');
        });

        it('dimensionModel의 bodyHeight값에 따라 height를 설정한다.', function() {
            grid.dimensionModel.set('bodyHeight', 200);
            body.render();
            expect($(body.el).height()).toBe(200);
        });

        it('selectionLayer와 bodyTable이 생성되었는지 확인한다.', function() {
            body.render();

            expect(body._viewList.length).toBe(2);
            _.each(body._viewList, function(childView) {
                expect(childView instanceof SelectionLayer || childView instanceof LayoutBodyTable).toBe(true);
                expect(body.$container).toContainElement(childView.el);
            });
        });
    });

    describe('grid.dimensionModel의 change:bodyHeight 이벤트 발생시', function() {
        it('el의 height를 dimensionModel의 bodyHeight 값으로 설정한다.', function() {
            grid.dimensionModel.set('bodyHeight', 70);
            expect(body.$el.height()).toBe(70);

            grid.dimensionModel.set('bodyHeight', 80);
            expect(body.$el.height()).toBe(80);
        });
    });
});
