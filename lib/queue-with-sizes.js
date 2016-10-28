'use strict';

var assert = require('assert');

var _require = require('./helpers.js'),
    IsFiniteNonNegativeNumber = _require.IsFiniteNonNegativeNumber;

exports.DequeueValue = function (queue) {
  assert(queue.length > 0, 'Spec-level failure: should never dequeue from an empty queue.');
  var pair = queue.shift();

  queue._totalSize -= pair.size;

  return pair.value;
};

exports.EnqueueValueWithSize = function (queue, value, size) {
  size = Number(size);
  if (!IsFiniteNonNegativeNumber(size)) {
    throw new RangeError('Size must be a finite, non-NaN, non-negative number.');
  }

  queue.push({ value: value, size: size });

  if (queue._totalSize === undefined) {
    queue._totalSize = 0;
  }
  queue._totalSize += size;
};

// This implementation is not per-spec. Total size is cached for speed.
exports.GetTotalQueueSize = function (queue) {
  if (queue._totalSize === undefined) {
    queue._totalSize = 0;
  }
  return queue._totalSize;
};

exports.PeekQueueValue = function (queue) {
  assert(queue.length > 0, 'Spec-level failure: should never peek at an empty queue.');
  var pair = queue[0];
  return pair.value;
};