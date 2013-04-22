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

//sort those, who have equal height
//sort those, who have equal width
/**
 * SHIT : There should be a limited number of allowed size;
 * SHIT : With unknown number of the images for each size;
 *
 * SHIT : Lets use 14:9 (so we will be able to use 16:10 (with small crop)
 *
 */

var equalSize = [ ];
var equalHeight = [ ];

/**
 * Lets just sort the block by its area
 */

/*console.log(boxes.sort(function(a, b) {
  var aa = a.width * a.height,
    bb = b.width * b.height,
    result = 0;

  if (aa !== bb) {
    result = aa > bb ? 1 : -1;
  }

  return result;
}));*/

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

    if (box.width + width + 100 > containerSize.width) {
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

  var i = boxes.length;

  rows = {};

  rowIndex = 1;

  while(--i >= 0) {
    var box = boxes[i];

    if (box.width + border * 2 > containerSize.width) {
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

  for(i in rows) {
    var filled = {
      left : 0
    };

    if (!rows.hasOwnProperty(i)) {
      continue;
    }

    row = rows[i];

    var rowWidth = (row.length + 1) * border,
      leftDelta = border;

    row.forEach(function(item, index) {
      rowWidth += item.width;
      if (index % 2 === 0) {
        leftDelta += item.width + border;
      }
    });

    var centerLeft = ((containerSize.width - rowWidth) / 2);

    row.forEach(function(item, index) {

      item.left = centerLeft + filled.left + border;

      filled.left += item.width + border;

      if (i > 0) {
        item.top = center.top - heightFilled.top - item.height;
      }
      else {
        item.top = center.top + heightFilled.bottom;
      }

      minTop = Math.min(minTop, item.top);
    });

    heightFilled[i > 0 ? 'top' : 'bottom'] += 1.5 * border + Math.max.apply(Math, row.map(function(item){ return item.height }));
  }

  var container = document.querySelector('.container');

  container.style.top = -1 * minTop + 'px';

  for(i in rows) {
    var row;

    if (!rows.hasOwnProperty(i)) {
      continue;
    }

    row = rows[i];

    row.forEach(function(item) {
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
}


