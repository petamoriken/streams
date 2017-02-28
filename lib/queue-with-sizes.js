'use strict';

var assert = require('assert');

var _require = require('./helpers.js'),
    IsFiniteNonNegativeNumber = _require.IsFiniteNonNegativeNumber;

exports.DequeueValue = function (container) {
  assert('_queue' in container && '_queueTotalSize' in container, 'Spec-level failure: DequeueValue should only be used on containers with [[queue]] and [[queueTotalSize]].');
  assert(container._queue.length > 0, 'Spec-level failure: should never dequeue from an empty queue.');

  var pair = container._queue.shift();
  container._queueTotalSize -= pair.size;
  if (container._queueTotalSize < 0) {
    container._queueTotalSize = 0;
  }

  return pair.value;
};

exports.EnqueueValueWithSize = function (container, value, size) {
  assert('_queue' in container && '_queueTotalSize' in container, 'Spec-level failure: EnqueueValueWithSize should only be used on containers with [[queue]] and ' + '[[queueTotalSize]].');

  size = Number(size);
  if (!IsFiniteNonNegativeNumber(size)) {
    throw new RangeError('Size must be a finite, non-NaN, non-negative number.');
  }

  container._queue.push({ value: value, size: size });
  container._queueTotalSize += size;
};

exports.PeekQueueValue = function (container) {
  assert('_queue' in container && '_queueTotalSize' in container, 'Spec-level failure: PeekQueueValue should only be used on containers with [[queue]] and [[queueTotalSize]].');
  assert(container._queue.length > 0, 'Spec-level failure: should never peek at an empty queue.');

  var pair = container._queue[0];
  return pair.value;
};

exports.ResetQueue = function (container) {
  assert('_queue' in container && '_queueTotalSize' in container, 'Spec-level failure: ResetQueue should only be used on containers with [[queue]] and [[queueTotalSize]].');

  container._queue = [];
  container._queueTotalSize = 0;
};