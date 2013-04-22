var boxes = [
  { width: 239, height: 160 },
  { width: 266, height: 177 },
  { width: 224, height: 146 },
  { width: 298, height: 198 },
  { width: 316, height: 206 },
  { width: 316, height: 208 },
  { width: 220, height: 110 },
  { width: 264, height: 176 },
  { width: 178, height: 120 },
  { width: 208, height: 122 },
  { width: 166, height: 248 },
  { width: 218, height: 146 },
  { width: 216, height: 144 },
  { width: 186, height: 126 },
  { width: 319, height: 212 },
  { width: 166, height: 110 },
  { width: 278, height: 184 },
  { width: 218, height: 148 }
];

/**
 * Lets sort boxes by its height
 */

boxes.sort(function(a, b) {
  var result = 0;

  if (a.height !== b.height) {
    result = a.height > b.height ? 1 : -1;
  }

  return result;
});

/**
 * Now we will try to build 2 parts, starting at the middle of the container
 */

function getContainerSize() {
  return {
    width  : window.innerWidth,
    height : window.innerHeight
  };
}
var containerSize;

var border = 10;

var containerPadding = {
  left   : 15,
  top    : 5,
  right  : 15,
  bottom : 5
};

var rows = {};
var rowIndex;

/**
 * Now we will start to paint
 * (counter)clockwise; Starting from bigger image up to the smaller;
 * The vector will be changed; -1,-1 == LT
 * The number of images in the row depend on container width
 */

function prepareRowIndex(box) {
  var width,
    row;

  while(true) {
    width = 0;
    row = rows[rowIndex] = rows[rowIndex] || [ ];

    width += (row.length + 1) * border;

    row.forEach(function(item) {
      width += item.width;
    });

    if (box.width + width + containerPadding.left + containerPadding.right + border*2 > containerSize.width) {
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

  containerSize = getContainerSize();

  var center = {
    left : Math.floor(containerSize.width / 2),
    top  : Math.floor(containerSize.height / 2)
  };

  var boxesCounter = boxes.length;

  rows = {};

  rowIndex = 1;

  while(--boxesCounter >= 0) {
    var box = boxes[boxesCounter];

    if (box.width + containerPadding.left + containerPadding.right + border*2 > containerSize.width) {
      //skip long picture
      continue;
    }

    prepareRowIndex(box);

    rows[rowIndex][rows[rowIndex].length % 2 ? 'unshift' : 'push'](box);

    rowIndex *= -1;
  }

  var heightFilled = {
    top    : Math.floor(border / 2),
    bottom : Math.floor(border / 2)
  };

//paint them
  var minTop = 0;

  var currentRowIndex;

  for(currentRowIndex in rows) {
    var filled = {
      left : 0
    };

    if (!rows.hasOwnProperty(currentRowIndex)) {
      continue;
    }

    currentRowIndex = parseInt(currentRowIndex, 10);


    row = rows[currentRowIndex];

    var rowWidth = (row.length + 1) * border,
      leftDelta = border;

    row.forEach(function(item, index) {
      rowWidth += item.width;
      if (index % 2 === 0) {
        leftDelta += item.width + border;
      }
    });

    var centerLeft = ((containerSize.width - rowWidth + containerPadding.left - containerPadding.right) / 2);

    row.forEach(function(item, index) {

      item.left = centerLeft + filled.left + border;

      filled.left += item.width + border;

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
        nearRow = rows[currentRowIndex - (currentRowIndex > 0 ? 1 : -1)].filter(function(item, ix) {
          var result = false,
            x1 = this.left - border,
            x2 = item.left,//???
            xw1 = x1 + this.width + border,
            xw2 = x2 + item.width;

          if (x1 >= x2 && x1 <= xw2 || xw1 >= x2 && xw1 <= xw2 || x2 >= x1 && x2 <= xw1 || xw2 >= x1 && xw2 <= xw1) {
            result = true;
          }

          return result;
        }, item);

        minDistance = Math.min.apply(Math, nearRow.map(function(item) {
          var value;

          if (currentRowIndex > 0) {
            value = item.top - this.top - this.height;
          }
          else {
            value = this.top - item.top - item.height;
          }
          return value;
        }, item));

        if (minDistance > border) {
          item.top += (currentRowIndex > 0 ? 1 : -1) * (minDistance - border);
        }
      }
    });

    heightFilled[currentRowIndex > 0 ? 'top' : 'bottom'] += border + Math.max.apply(Math, row.map(function(item){
      return item.height
    }));
  }

  var container = document.querySelector('.container');

  container.style.top = -1 * minTop + containerPadding.top + 'px';
  container.style.minHeight = heightFilled.top + heightFilled.bottom - containerPadding.top + containerPadding.bottom - Math.abs(minTop) + 'px';

  var i;

  for(i in rows) {
    var row;

    if (!rows.hasOwnProperty(i)) {
      continue;
    }

    row = rows[i];

    row.forEach(function(item, index) {
      if (!item.node) {
        item.node = document.createElement('div');
        item.node.style.position = 'absolute';

        item.node.style.backgroundColor = 'red';
        container.appendChild(item.node);
      }
      item.node.style.width = item.width + 'px';
      item.node.style.height = item.height + 'px';
      item.node.style.top = item.top + 'px';
      item.node.style.left = item.left + 'px';
      item.node.innerText = i + ' : ' + index;
    });
  }
}

paint();

var rTimer = null;

window.onresize = function() {
  clearTimeout(rTimer);
  rTimer = setTimeout(function() {
    paint();
  }, 200);
};
