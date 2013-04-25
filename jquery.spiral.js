/**
 * Version 0.1
 */
(function($) {
  $.fn.spiral = function(options) {
    options = $.extend({
      boxSelector : '>*',
      boxOffset   : 10,  //px
      transition  : 0.7, //s
      padding     : {
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
        $boxes.css(prefix + 'transition', 'top ' + options.transition + 's ease-out, left ' + options.transition + 's ease');

        if('relative|absolute'.indexOf($container.css('position')) < 0) {
          $container.css('position', 'relative');
        }

        onResize();

        $(window).on('resize.spiral', function() {
          clearTimeout(timerId);
          timerId = setTimeout(onResize, 200);
        });

      }

      function onResize() {
        paint();
      }

      function prepareRowIndex(box) {
        var width, row;

        while(true) {
          width = 0;
          row = rows[rowIndex] = rows[rowIndex] || [];

          width += (row.length + 1) * options.boxOffset;

          $.each(row, function(i, item) {
            width += item.width;
          });

          if (box.width + width + options.padding.left + options.padding.right + options.boxOffset * 2 > containerSize.width) {
            rowIndex *= -1;
            if (rowIndex > 0) {
              rowIndex++;
            }
            continue;
          }
          break;
        }
      }


      function paint() {
        $container[0].style.minHeight = 0;

        containerSize = getElemSize($container);

        var center = {
            left : Math.floor(containerSize.width / 2),
            top  : Math.floor(containerSize.height / 2)
          },
          boxesCounter = boxes.length,
          box = null;

        rows = {}; rowIndex = 1;

        while(--boxesCounter >= 0) {
          box = boxes[boxesCounter];

          if (box.width + options.padding.left + options.padding.right + options.boxOffset * 2 > containerSize.width) {
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
          boxHeight = 0,
          filled = null;

        $.each(rows, function(currentRowIndex, row) {
          filled = {
            left : 0
          };

          currentRowIndex = parseInt(currentRowIndex, 10);

          var rowWidth = (row.length + 1) * options.boxOffset,
            leftDelta = options.boxOffset;

          $.each(row, function(i, item) {
            rowWidth += item.width;
            if (i % 2 === 0) {
              leftDelta += item.width + options.boxOffset;
            }
          });

          var centerLeft = ((containerSize.width - rowWidth + options.padding.left - options.padding.right) / 2);

          $.each(row, function(i, item) {
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
            var nearRow, minDistance, context = item;

            if (Math.abs(currentRowIndex) > 1) {
              nearRow = $.grep(rows[currentRowIndex - (currentRowIndex > 0 ? 1 : -1)], function(item) {
                var result = false,
                  x1 = context.left - options.boxOffset,
                  x2 = item.left,//???
                  xw1 = x1 + context.width + options.boxOffset,
                  xw2 = x2 + item.width;

                if (x1 >= x2 && x1 <= xw2 || xw1 >= x2 && xw1 <= xw2 || x2 >= x1 && x2 <= xw1 || xw2 >= x1 && xw2 <= xw1) {
                  result = true;
                }

                return result;
              });

              minDistance = Math.min.apply(Math, $.map(nearRow, function(item) {
                var value;

                if (currentRowIndex > 0) {
                  value = item.top - context.top - context.height;
                }
                else {
                  value = context.top - item.top - item.height;
                }
                return value;
              }));

              if (minDistance > options.boxOffset) {
                item.top += (currentRowIndex > 0 ? 1 : -1) * (minDistance - options.boxOffset);
              }
            }
          });

          heightFilled[currentRowIndex > 0 ? 'top' : 'bottom'] += options.boxOffset + Math.max.apply(Math, $.map(row, function(item) {
            return item.height
          }));
        });

        //calculate coord
        var coord = { min : 0, max : 0, height : 0 };

        $.each(rows, function(index, row) {
          coord[index > 0 ? 'min' : 'max'] = Math[index > 0 ? 'min' : 'max'].apply(Math, $.map(row, function(item) {
            return item.top + (index < 0 ? item.height : 0);
          }));
        });

        coord.height = coord.max - coord.min;

        var realHeight = Math.max(coord.height, containerSize.height) + options.padding.top + options.padding.bottom;

        //normalize rows
        var deltaTop = (realHeight - coord.height) / 2 - coord.min;

        $.map(rows, function(row) {
          $.map(row, function(item) {
            item.top += deltaTop;
          });
        });

        $container[0].style.minHeight = realHeight + 'px';

        //normalize the top potision of the actual items
        $.each(rows, function(i, row) {
          $.each(row, function(j, item) {
            item.node.style.top = item.top + 'px';
            item.node.style.left = item.left + 'px';
          });
        });
      }

      init();
    });

    function getElemSize($el) {
      return {
        width  : $el.outerWidth(),
        height : $el.outerHeight()
      }
    }

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

      return sort(res, function(a, b) { return a.height - b.height });
    }
  };

  // Common functions

  function sort(arr, callback) {
    if(Array.prototype.sort) {
      return arr.sort(callback);
    } else {
      var buf = null,
        len = arr.length;

      for(var j = 0; j < len; j++) {
        for(var i = 0; i < len - 1; i++) {
          if(callback(arr[i], arr[i+1])  >= 0) {
            buf = arr[i];
            arr[i] = arr[i+1];
            arr[i+1] = buf;
          }
        }
      }

      return arr;
    }
  }

  function getPrefix() {
    var ua = navigator.userAgent, name = '';

    if (ua.search(/MSIE/) >= 0) {
      name = '-ms-';
    } else if (ua.search(/Firefox/) >= 0) {
      name = '-moz-';
    } else if (ua.search(/Opera/) >= 0) {
      name = '-o-';
    } else if (ua.search(/Chrome/) >= 0) {
      name = '-webkit-';
    } else if (ua.search(/Safari/) >= 0) {
      name = '-webkit-';
    }

    return name;
  }
})(jQuery);
