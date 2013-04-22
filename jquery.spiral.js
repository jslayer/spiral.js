(function($) {
  $.fn.spiral = function(options) {
    options = $.extend({
      'boxSelector' : '>*',
      'boxOffset'   : 10,  //px
      'transition'  : 700, //ms
      'containerPadding' : {
        left   : 10, //px
        top    : 10, //px
        right  : 10, //px
        bottom : 10  //px
      }
    }, options);

    return this.each(function() {
      var $container = $(this),
        containerSize = null,
        boxes = [],
        rows = {},
        rowIndex = null,
        timerId = null,
        prefix = getPrefix();

      function init() {
        var $boxes = $container.find(options.boxSelector);
        boxes = collectBoxes($boxes);

        $boxes.css('position', 'absolute');
        $boxes.css(prefix + 'transition', 'top ' + options.transition + 'ms ease-out, left ' + options.transition + 'ms ease');

        if('relative|absolute'.indexOf($container.css('position')) < 0) {
          $container.css('position', 'relative');
        }

        onResize();

        window.onresize = function() {
          clearTimeout(timerId);
          timerId = setTimeout(onResize, 200);
        };
      };

      function onResize() {
        containerSize = getElemSize($container);
        paint();
      };

      function prepareRowIndex(box) {
        var width, row, i;

        while(true) {
          width = 0;
          row = rows[rowIndex] = rows[rowIndex] || [];

          width += (row.length + 1) * options.boxOffset;

          for(i in row) {
            width += row[i].width;
          };

          if (box.width + width + options.containerPadding.left + options.containerPadding.right + options.boxOffset * 2 > containerSize.width) {
            rowIndex *= -1;
            if (rowIndex > 0) {
              rowIndex++;
            }
            continue;
          }
          break;
        }
      };


      function paint() {

        var center = {
          left : Math.floor(containerSize.width / 2),
          top  : Math.floor(containerSize.height / 2)
        },
          boxesCounter = boxes.length,
          box = null;

        rows = {}; rowIndex = 1;

        while(--boxesCounter >= 0) {
          box = boxes[boxesCounter];

          if (box.width + options.containerPadding.left + options.containerPadding.right + options.boxOffset * 2 > containerSize.width) {
            //skip long picture
            continue;
          }

          prepareRowIndex(box);

          rows[rowIndex][rows[rowIndex].length % 2 ? 'unshift' : 'push'](box);

          rowIndex *= -1;
        }

        var heightFilled = {
          top    : Math.floor(options.boxOffset / 2),
          bottom : Math.floor(options.boxOffset / 2)
        },
          minTop = 0,
          currentRowIndex = null,
          filled = null;

        for(currentRowIndex in rows) {
          filled = {
            left : 0
          };

          if (!rows.hasOwnProperty(currentRowIndex)) {
            continue;
          }

          currentRowIndex = parseInt(currentRowIndex, 10);

          row = rows[currentRowIndex];

          var rowWidth = (row.length + 1) * options.boxOffset,
            leftDelta = options.boxOffset,
            i = null;

          for(i in row) {
            rowWidth += row[i].width;
            if (i % 2 === 0) {
              leftDelta += row[i].width + options.boxOffset;
            }
          };

          var centerLeft = ((containerSize.width - rowWidth + options.containerPadding.left - options.containerPadding.right) / 2),
            el = null, item;

          for(i in row) {
            i = parseInt(i);
            item = row[i];

            item.left = centerLeft + filled.left + options.boxOffset;

            filled.left += item.width + options.boxOffset;

            if (currentRowIndex > 0) {
              item.top = center.top - heightFilled.top - item.height;
            }
            else {
              item.top = center.top + heightFilled.bottom;
            }

            minTop = Math.min(minTop, item.top);

            /**
             * in order to have less whitespaces we should move boxes closer if possible
             */
            var nearRow, minDistance;

            if (Math.abs(currentRowIndex) > 1) {
              nearRow = filterArray(rows[currentRowIndex - (currentRowIndex > 0 ? 1 : -1)], function(item, ix) {
                var result = false,
                  x1 = this.left - options.boxOffset,
                  x2 = item.left,//???
                  xw1 = x1 + this.width + options.boxOffset,
                  xw2 = x2 + item.width;

                if (x1 >= x2 && x1 <= xw2 || xw1 >= x2 && xw1 <= xw2 || x2 >= x1 && x2 <= xw1 || xw2 >= x1 && xw2 <= xw1) {
                  result = true;
                }

                return result;
              }, item);

              minDistance = Math.min.apply(Math, mapArray(nearRow, function(item) {
                var value;

                if (currentRowIndex > 0) {
                  value = item.top - this.top - this.height;
                }
                else {
                  value = this.top - item.top - item.height;
                }
                return value;
              }, item));

              if (minDistance > options.boxOffset) {
                item.top += (currentRowIndex > 0 ? 1 : -1) * (minDistance - options.boxOffset);
              }
            }
          };

          heightFilled[currentRowIndex > 0 ? 'top' : 'bottom'] += options.boxOffset + Math.max.apply(Math, mapArray(row, function(item) {
            return item.height
          }));
        }

        $container[0].style.top = -1 * minTop + options.containerPadding.top + 'px';
        $container[0].style.minHeight = heightFilled.top + heightFilled.bottom - options.containerPadding.top + options.containerPadding.bottom - Math.abs(minTop) + 'px';

        var i, j;

        for(i in rows) {
          var row;

          if (!rows.hasOwnProperty(i)) {
            continue;
          }

          row = rows[i];

          for(j in row) {
            row[j].node.style.top = row[j].top + 'px';
            row[j].node.style.left = row[j].left + 'px';
          };
        }
      };

      init();
    });

    function getElemSize($el) {
      return {
        width  : $el.outerWidth(),
        height : $el.outerHeight()
      }
    };

    function collectBoxes($boxes) {
      var $box, res = [];

      $boxes.each(function(i, el) {
        $box = $(el);

        res.push({
          width  : $box.outerWidth(),
          height : $box.outerHeight(),
          node   : $box[0]
        });
      });

      return res.sort(function(a, b) { return a.height - b.height });
    };
  };

  // Common functions

  function filterArray(arr, callback, scope) {
    var filtered = [], i;

    if(!(arr instanceof Array) || !(callback instanceof Function)) {
      return null;
    }

    if(Array.prototype.filter) {
      return arr.filter(callback, scope);
    }

    for(i in arr) {
      i = parseInt(i);
      if(callback.apply(scope, [arr[i], i, arr])) filtered.push(arr[i]);
    }

    return filtered;
  };

  function mapArray(arr, callback, scope) {
    var mapped = [], i;

    if(!(arr instanceof Array) || !(callback instanceof Function)) {
      return null;
    }

    if(Array.prototype.map) {
      return arr.map(callback, scope);
    }

    for(i in arr) {
      i = parseInt(i);
      mapped.push(callback.apply(scope, [arr[i], i, arr]));
    }

    return mapped;
  };

  function getPrefix() {
    var ua = navigator.userAgent, name = '';

    if (ua.search(/MSIE/) >= 0) name = '-ms-';
    if (ua.search(/Firefox/) >= 0) name = '-moz-';
    if (ua.search(/Opera/) >= 0) name = '-o-';
    if (ua.search(/Chrome/) >= 0) name = '-webkit-';
    if (ua.search(/Safari/) >= 0) name = '-webkit-';

    return name;
  };
})(jQuery);