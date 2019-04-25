(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
module.exports = after

function after(count, callback, err_cb) {
    var bail = false
    err_cb = err_cb || noop
    proxy.count = count

    return (count === 0) ? callback() : proxy

    function proxy(err, result) {
        if (proxy.count <= 0) {
            throw new Error('after called too many times')
        }
        --proxy.count

        // after first error, rest are passed to err_cb
        if (err) {
            bail = true
            callback(err)
            // future error callbacks will go to error handler
            callback = err_cb
        } else if (proxy.count === 0 && !bail) {
            callback(null, result)
        }
    }
}

function noop() {}

},{}],2:[function(require,module,exports){
/**
 * An abstraction for slicing an arraybuffer even when
 * ArrayBuffer.prototype.slice is not supported
 *
 * @api public
 */

module.exports = function(arraybuffer, start, end) {
  var bytes = arraybuffer.byteLength;
  start = start || 0;
  end = end || bytes;

  if (arraybuffer.slice) { return arraybuffer.slice(start, end); }

  if (start < 0) { start += bytes; }
  if (end < 0) { end += bytes; }
  if (end > bytes) { end = bytes; }

  if (start >= bytes || start >= end || bytes === 0) {
    return new ArrayBuffer(0);
  }

  var abv = new Uint8Array(arraybuffer);
  var result = new Uint8Array(end - start);
  for (var i = start, ii = 0; i < end; i++, ii++) {
    result[ii] = abv[i];
  }
  return result.buffer;
};

},{}],3:[function(require,module,exports){

/**
 * Expose `Backoff`.
 */

module.exports = Backoff;

/**
 * Initialize backoff timer with `opts`.
 *
 * - `min` initial timeout in milliseconds [100]
 * - `max` max timeout [10000]
 * - `jitter` [0]
 * - `factor` [2]
 *
 * @param {Object} opts
 * @api public
 */

function Backoff(opts) {
  opts = opts || {};
  this.ms = opts.min || 100;
  this.max = opts.max || 10000;
  this.factor = opts.factor || 2;
  this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
  this.attempts = 0;
}

/**
 * Return the backoff duration.
 *
 * @return {Number}
 * @api public
 */

Backoff.prototype.duration = function(){
  var ms = this.ms * Math.pow(this.factor, this.attempts++);
  if (this.jitter) {
    var rand =  Math.random();
    var deviation = Math.floor(rand * this.jitter * ms);
    ms = (Math.floor(rand * 10) & 1) == 0  ? ms - deviation : ms + deviation;
  }
  return Math.min(ms, this.max) | 0;
};

/**
 * Reset the number of attempts.
 *
 * @api public
 */

Backoff.prototype.reset = function(){
  this.attempts = 0;
};

/**
 * Set the minimum duration
 *
 * @api public
 */

Backoff.prototype.setMin = function(min){
  this.ms = min;
};

/**
 * Set the maximum duration
 *
 * @api public
 */

Backoff.prototype.setMax = function(max){
  this.max = max;
};

/**
 * Set the jitter
 *
 * @api public
 */

Backoff.prototype.setJitter = function(jitter){
  this.jitter = jitter;
};


},{}],4:[function(require,module,exports){
/*
 * base64-arraybuffer
 * https://github.com/niklasvh/base64-arraybuffer
 *
 * Copyright (c) 2012 Niklas von Hertzen
 * Licensed under the MIT license.
 */
(function(){
  "use strict";

  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  // Use a lookup table to find the index.
  var lookup = new Uint8Array(256);
  for (var i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }

  exports.encode = function(arraybuffer) {
    var bytes = new Uint8Array(arraybuffer),
    i, len = bytes.length, base64 = "";

    for (i = 0; i < len; i+=3) {
      base64 += chars[bytes[i] >> 2];
      base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
      base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
      base64 += chars[bytes[i + 2] & 63];
    }

    if ((len % 3) === 2) {
      base64 = base64.substring(0, base64.length - 1) + "=";
    } else if (len % 3 === 1) {
      base64 = base64.substring(0, base64.length - 2) + "==";
    }

    return base64;
  };

  exports.decode =  function(base64) {
    var bufferLength = base64.length * 0.75,
    len = base64.length, i, p = 0,
    encoded1, encoded2, encoded3, encoded4;

    if (base64[base64.length - 1] === "=") {
      bufferLength--;
      if (base64[base64.length - 2] === "=") {
        bufferLength--;
      }
    }

    var arraybuffer = new ArrayBuffer(bufferLength),
    bytes = new Uint8Array(arraybuffer);

    for (i = 0; i < len; i+=4) {
      encoded1 = lookup[base64.charCodeAt(i)];
      encoded2 = lookup[base64.charCodeAt(i+1)];
      encoded3 = lookup[base64.charCodeAt(i+2)];
      encoded4 = lookup[base64.charCodeAt(i+3)];

      bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
      bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
      bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }

    return arraybuffer;
  };
})();

},{}],5:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  for (var i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],6:[function(require,module,exports){
/**
 * Create a blob builder even when vendor prefixes exist
 */

var BlobBuilder = typeof BlobBuilder !== 'undefined' ? BlobBuilder :
  typeof WebKitBlobBuilder !== 'undefined' ? WebKitBlobBuilder :
  typeof MSBlobBuilder !== 'undefined' ? MSBlobBuilder :
  typeof MozBlobBuilder !== 'undefined' ? MozBlobBuilder : 
  false;

/**
 * Check if Blob constructor is supported
 */

var blobSupported = (function() {
  try {
    var a = new Blob(['hi']);
    return a.size === 2;
  } catch(e) {
    return false;
  }
})();

/**
 * Check if Blob constructor supports ArrayBufferViews
 * Fails in Safari 6, so we need to map to ArrayBuffers there.
 */

var blobSupportsArrayBufferView = blobSupported && (function() {
  try {
    var b = new Blob([new Uint8Array([1,2])]);
    return b.size === 2;
  } catch(e) {
    return false;
  }
})();

/**
 * Check if BlobBuilder is supported
 */

var blobBuilderSupported = BlobBuilder
  && BlobBuilder.prototype.append
  && BlobBuilder.prototype.getBlob;

/**
 * Helper function that maps ArrayBufferViews to ArrayBuffers
 * Used by BlobBuilder constructor and old browsers that didn't
 * support it in the Blob constructor.
 */

function mapArrayBufferViews(ary) {
  return ary.map(function(chunk) {
    if (chunk.buffer instanceof ArrayBuffer) {
      var buf = chunk.buffer;

      // if this is a subarray, make a copy so we only
      // include the subarray region from the underlying buffer
      if (chunk.byteLength !== buf.byteLength) {
        var copy = new Uint8Array(chunk.byteLength);
        copy.set(new Uint8Array(buf, chunk.byteOffset, chunk.byteLength));
        buf = copy.buffer;
      }

      return buf;
    }

    return chunk;
  });
}

function BlobBuilderConstructor(ary, options) {
  options = options || {};

  var bb = new BlobBuilder();
  mapArrayBufferViews(ary).forEach(function(part) {
    bb.append(part);
  });

  return (options.type) ? bb.getBlob(options.type) : bb.getBlob();
};

function BlobConstructor(ary, options) {
  return new Blob(mapArrayBufferViews(ary), options || {});
};

if (typeof Blob !== 'undefined') {
  BlobBuilderConstructor.prototype = Blob.prototype;
  BlobConstructor.prototype = Blob.prototype;
}

module.exports = (function() {
  if (blobSupported) {
    return blobSupportsArrayBufferView ? Blob : BlobConstructor;
  } else if (blobBuilderSupported) {
    return BlobBuilderConstructor;
  } else {
    return undefined;
  }
})();

},{}],7:[function(require,module,exports){

},{}],8:[function(require,module,exports){
(function (Buffer){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

}).call(this,require("buffer").Buffer)
},{"base64-js":5,"buffer":8,"ieee754":28}],9:[function(require,module,exports){
/**
 * Slice reference.
 */

var slice = [].slice;

/**
 * Bind `obj` to `fn`.
 *
 * @param {Object} obj
 * @param {Function|String} fn or string
 * @return {Function}
 * @api public
 */

module.exports = function(obj, fn){
  if ('string' == typeof fn) fn = obj[fn];
  if ('function' != typeof fn) throw new Error('bind() requires a function');
  var args = slice.call(arguments, 2);
  return function(){
    return fn.apply(obj, args.concat(slice.call(arguments)));
  }
};

},{}],10:[function(require,module,exports){

/**
 * Expose `Emitter`.
 */

if (typeof module !== 'undefined') {
  module.exports = Emitter;
}

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  function on() {
    this.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks['$' + event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks['$' + event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks['$' + event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks['$' + event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

},{}],11:[function(require,module,exports){

module.exports = function(a, b){
  var fn = function(){};
  fn.prototype = b.prototype;
  a.prototype = new fn;
  a.prototype.constructor = a;
};
},{}],12:[function(require,module,exports){

module.exports = require('./socket');

/**
 * Exports parser
 *
 * @api public
 *
 */
module.exports.parser = require('engine.io-parser');

},{"./socket":13,"engine.io-parser":23}],13:[function(require,module,exports){
/**
 * Module dependencies.
 */

var transports = require('./transports/index');
var Emitter = require('component-emitter');
var debug = require('debug')('engine.io-client:socket');
var index = require('indexof');
var parser = require('engine.io-parser');
var parseuri = require('parseuri');
var parseqs = require('parseqs');

/**
 * Module exports.
 */

module.exports = Socket;

/**
 * Socket constructor.
 *
 * @param {String|Object} uri or options
 * @param {Object} options
 * @api public
 */

function Socket (uri, opts) {
  if (!(this instanceof Socket)) return new Socket(uri, opts);

  opts = opts || {};

  if (uri && 'object' === typeof uri) {
    opts = uri;
    uri = null;
  }

  if (uri) {
    uri = parseuri(uri);
    opts.hostname = uri.host;
    opts.secure = uri.protocol === 'https' || uri.protocol === 'wss';
    opts.port = uri.port;
    if (uri.query) opts.query = uri.query;
  } else if (opts.host) {
    opts.hostname = parseuri(opts.host).host;
  }

  this.secure = null != opts.secure ? opts.secure
    : (typeof location !== 'undefined' && 'https:' === location.protocol);

  if (opts.hostname && !opts.port) {
    // if no port is specified manually, use the protocol default
    opts.port = this.secure ? '443' : '80';
  }

  this.agent = opts.agent || false;
  this.hostname = opts.hostname ||
    (typeof location !== 'undefined' ? location.hostname : 'localhost');
  this.port = opts.port || (typeof location !== 'undefined' && location.port
      ? location.port
      : (this.secure ? 443 : 80));
  this.query = opts.query || {};
  if ('string' === typeof this.query) this.query = parseqs.decode(this.query);
  this.upgrade = false !== opts.upgrade;
  this.path = (opts.path || '/engine.io').replace(/\/$/, '') + '/';
  this.forceJSONP = !!opts.forceJSONP;
  this.jsonp = false !== opts.jsonp;
  this.forceBase64 = !!opts.forceBase64;
  this.enablesXDR = !!opts.enablesXDR;
  this.timestampParam = opts.timestampParam || 't';
  this.timestampRequests = opts.timestampRequests;
  this.transports = opts.transports || ['polling', 'websocket'];
  this.transportOptions = opts.transportOptions || {};
  this.readyState = '';
  this.writeBuffer = [];
  this.prevBufferLen = 0;
  this.policyPort = opts.policyPort || 843;
  this.rememberUpgrade = opts.rememberUpgrade || false;
  this.binaryType = null;
  this.onlyBinaryUpgrades = opts.onlyBinaryUpgrades;
  this.perMessageDeflate = false !== opts.perMessageDeflate ? (opts.perMessageDeflate || {}) : false;

  if (true === this.perMessageDeflate) this.perMessageDeflate = {};
  if (this.perMessageDeflate && null == this.perMessageDeflate.threshold) {
    this.perMessageDeflate.threshold = 1024;
  }

  // SSL options for Node.js client
  this.pfx = opts.pfx || null;
  this.key = opts.key || null;
  this.passphrase = opts.passphrase || null;
  this.cert = opts.cert || null;
  this.ca = opts.ca || null;
  this.ciphers = opts.ciphers || null;
  this.rejectUnauthorized = opts.rejectUnauthorized === undefined ? true : opts.rejectUnauthorized;
  this.forceNode = !!opts.forceNode;

  // detect ReactNative environment
  this.isReactNative = (typeof navigator !== 'undefined' && typeof navigator.product === 'string' && navigator.product.toLowerCase() === 'reactnative');

  // other options for Node.js or ReactNative client
  if (typeof self === 'undefined' || this.isReactNative) {
    if (opts.extraHeaders && Object.keys(opts.extraHeaders).length > 0) {
      this.extraHeaders = opts.extraHeaders;
    }

    if (opts.localAddress) {
      this.localAddress = opts.localAddress;
    }
  }

  // set on handshake
  this.id = null;
  this.upgrades = null;
  this.pingInterval = null;
  this.pingTimeout = null;

  // set on heartbeat
  this.pingIntervalTimer = null;
  this.pingTimeoutTimer = null;

  this.open();
}

Socket.priorWebsocketSuccess = false;

/**
 * Mix in `Emitter`.
 */

Emitter(Socket.prototype);

/**
 * Protocol version.
 *
 * @api public
 */

Socket.protocol = parser.protocol; // this is an int

/**
 * Expose deps for legacy compatibility
 * and standalone browser access.
 */

Socket.Socket = Socket;
Socket.Transport = require('./transport');
Socket.transports = require('./transports/index');
Socket.parser = require('engine.io-parser');

/**
 * Creates transport of the given type.
 *
 * @param {String} transport name
 * @return {Transport}
 * @api private
 */

Socket.prototype.createTransport = function (name) {
  debug('creating transport "%s"', name);
  var query = clone(this.query);

  // append engine.io protocol identifier
  query.EIO = parser.protocol;

  // transport name
  query.transport = name;

  // per-transport options
  var options = this.transportOptions[name] || {};

  // session id if we already have one
  if (this.id) query.sid = this.id;

  var transport = new transports[name]({
    query: query,
    socket: this,
    agent: options.agent || this.agent,
    hostname: options.hostname || this.hostname,
    port: options.port || this.port,
    secure: options.secure || this.secure,
    path: options.path || this.path,
    forceJSONP: options.forceJSONP || this.forceJSONP,
    jsonp: options.jsonp || this.jsonp,
    forceBase64: options.forceBase64 || this.forceBase64,
    enablesXDR: options.enablesXDR || this.enablesXDR,
    timestampRequests: options.timestampRequests || this.timestampRequests,
    timestampParam: options.timestampParam || this.timestampParam,
    policyPort: options.policyPort || this.policyPort,
    pfx: options.pfx || this.pfx,
    key: options.key || this.key,
    passphrase: options.passphrase || this.passphrase,
    cert: options.cert || this.cert,
    ca: options.ca || this.ca,
    ciphers: options.ciphers || this.ciphers,
    rejectUnauthorized: options.rejectUnauthorized || this.rejectUnauthorized,
    perMessageDeflate: options.perMessageDeflate || this.perMessageDeflate,
    extraHeaders: options.extraHeaders || this.extraHeaders,
    forceNode: options.forceNode || this.forceNode,
    localAddress: options.localAddress || this.localAddress,
    requestTimeout: options.requestTimeout || this.requestTimeout,
    protocols: options.protocols || void (0),
    isReactNative: this.isReactNative
  });

  return transport;
};

function clone (obj) {
  var o = {};
  for (var i in obj) {
    if (obj.hasOwnProperty(i)) {
      o[i] = obj[i];
    }
  }
  return o;
}

/**
 * Initializes transport to use and starts probe.
 *
 * @api private
 */
Socket.prototype.open = function () {
  var transport;
  if (this.rememberUpgrade && Socket.priorWebsocketSuccess && this.transports.indexOf('websocket') !== -1) {
    transport = 'websocket';
  } else if (0 === this.transports.length) {
    // Emit error on next tick so it can be listened to
    var self = this;
    setTimeout(function () {
      self.emit('error', 'No transports available');
    }, 0);
    return;
  } else {
    transport = this.transports[0];
  }
  this.readyState = 'opening';

  // Retry with the next transport if the transport is disabled (jsonp: false)
  try {
    transport = this.createTransport(transport);
  } catch (e) {
    this.transports.shift();
    this.open();
    return;
  }

  transport.open();
  this.setTransport(transport);
};

/**
 * Sets the current transport. Disables the existing one (if any).
 *
 * @api private
 */

Socket.prototype.setTransport = function (transport) {
  debug('setting transport %s', transport.name);
  var self = this;

  if (this.transport) {
    debug('clearing existing transport %s', this.transport.name);
    this.transport.removeAllListeners();
  }

  // set up transport
  this.transport = transport;

  // set up transport listeners
  transport
  .on('drain', function () {
    self.onDrain();
  })
  .on('packet', function (packet) {
    self.onPacket(packet);
  })
  .on('error', function (e) {
    self.onError(e);
  })
  .on('close', function () {
    self.onClose('transport close');
  });
};

/**
 * Probes a transport.
 *
 * @param {String} transport name
 * @api private
 */

Socket.prototype.probe = function (name) {
  debug('probing transport "%s"', name);
  var transport = this.createTransport(name, { probe: 1 });
  var failed = false;
  var self = this;

  Socket.priorWebsocketSuccess = false;

  function onTransportOpen () {
    if (self.onlyBinaryUpgrades) {
      var upgradeLosesBinary = !this.supportsBinary && self.transport.supportsBinary;
      failed = failed || upgradeLosesBinary;
    }
    if (failed) return;

    debug('probe transport "%s" opened', name);
    transport.send([{ type: 'ping', data: 'probe' }]);
    transport.once('packet', function (msg) {
      if (failed) return;
      if ('pong' === msg.type && 'probe' === msg.data) {
        debug('probe transport "%s" pong', name);
        self.upgrading = true;
        self.emit('upgrading', transport);
        if (!transport) return;
        Socket.priorWebsocketSuccess = 'websocket' === transport.name;

        debug('pausing current transport "%s"', self.transport.name);
        self.transport.pause(function () {
          if (failed) return;
          if ('closed' === self.readyState) return;
          debug('changing transport and sending upgrade packet');

          cleanup();

          self.setTransport(transport);
          transport.send([{ type: 'upgrade' }]);
          self.emit('upgrade', transport);
          transport = null;
          self.upgrading = false;
          self.flush();
        });
      } else {
        debug('probe transport "%s" failed', name);
        var err = new Error('probe error');
        err.transport = transport.name;
        self.emit('upgradeError', err);
      }
    });
  }

  function freezeTransport () {
    if (failed) return;

    // Any callback called by transport should be ignored since now
    failed = true;

    cleanup();

    transport.close();
    transport = null;
  }

  // Handle any error that happens while probing
  function onerror (err) {
    var error = new Error('probe error: ' + err);
    error.transport = transport.name;

    freezeTransport();

    debug('probe transport "%s" failed because of error: %s', name, err);

    self.emit('upgradeError', error);
  }

  function onTransportClose () {
    onerror('transport closed');
  }

  // When the socket is closed while we're probing
  function onclose () {
    onerror('socket closed');
  }

  // When the socket is upgraded while we're probing
  function onupgrade (to) {
    if (transport && to.name !== transport.name) {
      debug('"%s" works - aborting "%s"', to.name, transport.name);
      freezeTransport();
    }
  }

  // Remove all listeners on the transport and on self
  function cleanup () {
    transport.removeListener('open', onTransportOpen);
    transport.removeListener('error', onerror);
    transport.removeListener('close', onTransportClose);
    self.removeListener('close', onclose);
    self.removeListener('upgrading', onupgrade);
  }

  transport.once('open', onTransportOpen);
  transport.once('error', onerror);
  transport.once('close', onTransportClose);

  this.once('close', onclose);
  this.once('upgrading', onupgrade);

  transport.open();
};

/**
 * Called when connection is deemed open.
 *
 * @api public
 */

Socket.prototype.onOpen = function () {
  debug('socket open');
  this.readyState = 'open';
  Socket.priorWebsocketSuccess = 'websocket' === this.transport.name;
  this.emit('open');
  this.flush();

  // we check for `readyState` in case an `open`
  // listener already closed the socket
  if ('open' === this.readyState && this.upgrade && this.transport.pause) {
    debug('starting upgrade probes');
    for (var i = 0, l = this.upgrades.length; i < l; i++) {
      this.probe(this.upgrades[i]);
    }
  }
};

/**
 * Handles a packet.
 *
 * @api private
 */

Socket.prototype.onPacket = function (packet) {
  if ('opening' === this.readyState || 'open' === this.readyState ||
      'closing' === this.readyState) {
    debug('socket receive: type "%s", data "%s"', packet.type, packet.data);

    this.emit('packet', packet);

    // Socket is live - any packet counts
    this.emit('heartbeat');

    switch (packet.type) {
      case 'open':
        this.onHandshake(JSON.parse(packet.data));
        break;

      case 'pong':
        this.setPing();
        this.emit('pong');
        break;

      case 'error':
        var err = new Error('server error');
        err.code = packet.data;
        this.onError(err);
        break;

      case 'message':
        this.emit('data', packet.data);
        this.emit('message', packet.data);
        break;
    }
  } else {
    debug('packet received with socket readyState "%s"', this.readyState);
  }
};

/**
 * Called upon handshake completion.
 *
 * @param {Object} handshake obj
 * @api private
 */

Socket.prototype.onHandshake = function (data) {
  this.emit('handshake', data);
  this.id = data.sid;
  this.transport.query.sid = data.sid;
  this.upgrades = this.filterUpgrades(data.upgrades);
  this.pingInterval = data.pingInterval;
  this.pingTimeout = data.pingTimeout;
  this.onOpen();
  // In case open handler closes socket
  if ('closed' === this.readyState) return;
  this.setPing();

  // Prolong liveness of socket on heartbeat
  this.removeListener('heartbeat', this.onHeartbeat);
  this.on('heartbeat', this.onHeartbeat);
};

/**
 * Resets ping timeout.
 *
 * @api private
 */

Socket.prototype.onHeartbeat = function (timeout) {
  clearTimeout(this.pingTimeoutTimer);
  var self = this;
  self.pingTimeoutTimer = setTimeout(function () {
    if ('closed' === self.readyState) return;
    self.onClose('ping timeout');
  }, timeout || (self.pingInterval + self.pingTimeout));
};

/**
 * Pings server every `this.pingInterval` and expects response
 * within `this.pingTimeout` or closes connection.
 *
 * @api private
 */

Socket.prototype.setPing = function () {
  var self = this;
  clearTimeout(self.pingIntervalTimer);
  self.pingIntervalTimer = setTimeout(function () {
    debug('writing ping packet - expecting pong within %sms', self.pingTimeout);
    self.ping();
    self.onHeartbeat(self.pingTimeout);
  }, self.pingInterval);
};

/**
* Sends a ping packet.
*
* @api private
*/

Socket.prototype.ping = function () {
  var self = this;
  this.sendPacket('ping', function () {
    self.emit('ping');
  });
};

/**
 * Called on `drain` event
 *
 * @api private
 */

Socket.prototype.onDrain = function () {
  this.writeBuffer.splice(0, this.prevBufferLen);

  // setting prevBufferLen = 0 is very important
  // for example, when upgrading, upgrade packet is sent over,
  // and a nonzero prevBufferLen could cause problems on `drain`
  this.prevBufferLen = 0;

  if (0 === this.writeBuffer.length) {
    this.emit('drain');
  } else {
    this.flush();
  }
};

/**
 * Flush write buffers.
 *
 * @api private
 */

Socket.prototype.flush = function () {
  if ('closed' !== this.readyState && this.transport.writable &&
    !this.upgrading && this.writeBuffer.length) {
    debug('flushing %d packets in socket', this.writeBuffer.length);
    this.transport.send(this.writeBuffer);
    // keep track of current length of writeBuffer
    // splice writeBuffer and callbackBuffer on `drain`
    this.prevBufferLen = this.writeBuffer.length;
    this.emit('flush');
  }
};

/**
 * Sends a message.
 *
 * @param {String} message.
 * @param {Function} callback function.
 * @param {Object} options.
 * @return {Socket} for chaining.
 * @api public
 */

Socket.prototype.write =
Socket.prototype.send = function (msg, options, fn) {
  this.sendPacket('message', msg, options, fn);
  return this;
};

/**
 * Sends a packet.
 *
 * @param {String} packet type.
 * @param {String} data.
 * @param {Object} options.
 * @param {Function} callback function.
 * @api private
 */

Socket.prototype.sendPacket = function (type, data, options, fn) {
  if ('function' === typeof data) {
    fn = data;
    data = undefined;
  }

  if ('function' === typeof options) {
    fn = options;
    options = null;
  }

  if ('closing' === this.readyState || 'closed' === this.readyState) {
    return;
  }

  options = options || {};
  options.compress = false !== options.compress;

  var packet = {
    type: type,
    data: data,
    options: options
  };
  this.emit('packetCreate', packet);
  this.writeBuffer.push(packet);
  if (fn) this.once('flush', fn);
  this.flush();
};

/**
 * Closes the connection.
 *
 * @api private
 */

Socket.prototype.close = function () {
  if ('opening' === this.readyState || 'open' === this.readyState) {
    this.readyState = 'closing';

    var self = this;

    if (this.writeBuffer.length) {
      this.once('drain', function () {
        if (this.upgrading) {
          waitForUpgrade();
        } else {
          close();
        }
      });
    } else if (this.upgrading) {
      waitForUpgrade();
    } else {
      close();
    }
  }

  function close () {
    self.onClose('forced close');
    debug('socket closing - telling transport to close');
    self.transport.close();
  }

  function cleanupAndClose () {
    self.removeListener('upgrade', cleanupAndClose);
    self.removeListener('upgradeError', cleanupAndClose);
    close();
  }

  function waitForUpgrade () {
    // wait for upgrade to finish since we can't send packets while pausing a transport
    self.once('upgrade', cleanupAndClose);
    self.once('upgradeError', cleanupAndClose);
  }

  return this;
};

/**
 * Called upon transport error
 *
 * @api private
 */

Socket.prototype.onError = function (err) {
  debug('socket error %j', err);
  Socket.priorWebsocketSuccess = false;
  this.emit('error', err);
  this.onClose('transport error', err);
};

/**
 * Called upon transport close.
 *
 * @api private
 */

Socket.prototype.onClose = function (reason, desc) {
  if ('opening' === this.readyState || 'open' === this.readyState || 'closing' === this.readyState) {
    debug('socket close with reason: "%s"', reason);
    var self = this;

    // clear timers
    clearTimeout(this.pingIntervalTimer);
    clearTimeout(this.pingTimeoutTimer);

    // stop event from firing again for transport
    this.transport.removeAllListeners('close');

    // ensure transport won't stay open
    this.transport.close();

    // ignore further transport communication
    this.transport.removeAllListeners();

    // set ready state
    this.readyState = 'closed';

    // clear session id
    this.id = null;

    // emit close event
    this.emit('close', reason, desc);

    // clean buffers after, so users can still
    // grab the buffers on `close` event
    self.writeBuffer = [];
    self.prevBufferLen = 0;
  }
};

/**
 * Filters upgrades, returning only those matching client transports.
 *
 * @param {Array} server upgrades
 * @api private
 *
 */

Socket.prototype.filterUpgrades = function (upgrades) {
  var filteredUpgrades = [];
  for (var i = 0, j = upgrades.length; i < j; i++) {
    if (~index(this.transports, upgrades[i])) filteredUpgrades.push(upgrades[i]);
  }
  return filteredUpgrades;
};

},{"./transport":14,"./transports/index":15,"component-emitter":10,"debug":21,"engine.io-parser":23,"indexof":29,"parseqs":32,"parseuri":33}],14:[function(require,module,exports){
/**
 * Module dependencies.
 */

var parser = require('engine.io-parser');
var Emitter = require('component-emitter');

/**
 * Module exports.
 */

module.exports = Transport;

/**
 * Transport abstract constructor.
 *
 * @param {Object} options.
 * @api private
 */

function Transport (opts) {
  this.path = opts.path;
  this.hostname = opts.hostname;
  this.port = opts.port;
  this.secure = opts.secure;
  this.query = opts.query;
  this.timestampParam = opts.timestampParam;
  this.timestampRequests = opts.timestampRequests;
  this.readyState = '';
  this.agent = opts.agent || false;
  this.socket = opts.socket;
  this.enablesXDR = opts.enablesXDR;

  // SSL options for Node.js client
  this.pfx = opts.pfx;
  this.key = opts.key;
  this.passphrase = opts.passphrase;
  this.cert = opts.cert;
  this.ca = opts.ca;
  this.ciphers = opts.ciphers;
  this.rejectUnauthorized = opts.rejectUnauthorized;
  this.forceNode = opts.forceNode;

  // results of ReactNative environment detection
  this.isReactNative = opts.isReactNative;

  // other options for Node.js client
  this.extraHeaders = opts.extraHeaders;
  this.localAddress = opts.localAddress;
}

/**
 * Mix in `Emitter`.
 */

Emitter(Transport.prototype);

/**
 * Emits an error.
 *
 * @param {String} str
 * @return {Transport} for chaining
 * @api public
 */

Transport.prototype.onError = function (msg, desc) {
  var err = new Error(msg);
  err.type = 'TransportError';
  err.description = desc;
  this.emit('error', err);
  return this;
};

/**
 * Opens the transport.
 *
 * @api public
 */

Transport.prototype.open = function () {
  if ('closed' === this.readyState || '' === this.readyState) {
    this.readyState = 'opening';
    this.doOpen();
  }

  return this;
};

/**
 * Closes the transport.
 *
 * @api private
 */

Transport.prototype.close = function () {
  if ('opening' === this.readyState || 'open' === this.readyState) {
    this.doClose();
    this.onClose();
  }

  return this;
};

/**
 * Sends multiple packets.
 *
 * @param {Array} packets
 * @api private
 */

Transport.prototype.send = function (packets) {
  if ('open' === this.readyState) {
    this.write(packets);
  } else {
    throw new Error('Transport not open');
  }
};

/**
 * Called upon open
 *
 * @api private
 */

Transport.prototype.onOpen = function () {
  this.readyState = 'open';
  this.writable = true;
  this.emit('open');
};

/**
 * Called with data.
 *
 * @param {String} data
 * @api private
 */

Transport.prototype.onData = function (data) {
  var packet = parser.decodePacket(data, this.socket.binaryType);
  this.onPacket(packet);
};

/**
 * Called with a decoded packet.
 */

Transport.prototype.onPacket = function (packet) {
  this.emit('packet', packet);
};

/**
 * Called upon close.
 *
 * @api private
 */

Transport.prototype.onClose = function () {
  this.readyState = 'closed';
  this.emit('close');
};

},{"component-emitter":10,"engine.io-parser":23}],15:[function(require,module,exports){
/**
 * Module dependencies
 */

var XMLHttpRequest = require('xmlhttprequest-ssl');
var XHR = require('./polling-xhr');
var JSONP = require('./polling-jsonp');
var websocket = require('./websocket');

/**
 * Export transports.
 */

exports.polling = polling;
exports.websocket = websocket;

/**
 * Polling transport polymorphic constructor.
 * Decides on xhr vs jsonp based on feature detection.
 *
 * @api private
 */

function polling (opts) {
  var xhr;
  var xd = false;
  var xs = false;
  var jsonp = false !== opts.jsonp;

  if (typeof location !== 'undefined') {
    var isSSL = 'https:' === location.protocol;
    var port = location.port;

    // some user agents have empty `location.port`
    if (!port) {
      port = isSSL ? 443 : 80;
    }

    xd = opts.hostname !== location.hostname || port !== opts.port;
    xs = opts.secure !== isSSL;
  }

  opts.xdomain = xd;
  opts.xscheme = xs;
  xhr = new XMLHttpRequest(opts);

  if ('open' in xhr && !opts.forceJSONP) {
    return new XHR(opts);
  } else {
    if (!jsonp) throw new Error('JSONP disabled');
    return new JSONP(opts);
  }
}

},{"./polling-jsonp":16,"./polling-xhr":17,"./websocket":19,"xmlhttprequest-ssl":20}],16:[function(require,module,exports){
(function (global){
/**
 * Module requirements.
 */

var Polling = require('./polling');
var inherit = require('component-inherit');

/**
 * Module exports.
 */

module.exports = JSONPPolling;

/**
 * Cached regular expressions.
 */

var rNewline = /\n/g;
var rEscapedNewline = /\\n/g;

/**
 * Global JSONP callbacks.
 */

var callbacks;

/**
 * Noop.
 */

function empty () { }

/**
 * Until https://github.com/tc39/proposal-global is shipped.
 */
function glob () {
  return typeof self !== 'undefined' ? self
      : typeof window !== 'undefined' ? window
      : typeof global !== 'undefined' ? global : {};
}

/**
 * JSONP Polling constructor.
 *
 * @param {Object} opts.
 * @api public
 */

function JSONPPolling (opts) {
  Polling.call(this, opts);

  this.query = this.query || {};

  // define global callbacks array if not present
  // we do this here (lazily) to avoid unneeded global pollution
  if (!callbacks) {
    // we need to consider multiple engines in the same page
    var global = glob();
    callbacks = global.___eio = (global.___eio || []);
  }

  // callback identifier
  this.index = callbacks.length;

  // add callback to jsonp global
  var self = this;
  callbacks.push(function (msg) {
    self.onData(msg);
  });

  // append to query string
  this.query.j = this.index;

  // prevent spurious errors from being emitted when the window is unloaded
  if (typeof addEventListener === 'function') {
    addEventListener('beforeunload', function () {
      if (self.script) self.script.onerror = empty;
    }, false);
  }
}

/**
 * Inherits from Polling.
 */

inherit(JSONPPolling, Polling);

/*
 * JSONP only supports binary as base64 encoded strings
 */

JSONPPolling.prototype.supportsBinary = false;

/**
 * Closes the socket.
 *
 * @api private
 */

JSONPPolling.prototype.doClose = function () {
  if (this.script) {
    this.script.parentNode.removeChild(this.script);
    this.script = null;
  }

  if (this.form) {
    this.form.parentNode.removeChild(this.form);
    this.form = null;
    this.iframe = null;
  }

  Polling.prototype.doClose.call(this);
};

/**
 * Starts a poll cycle.
 *
 * @api private
 */

JSONPPolling.prototype.doPoll = function () {
  var self = this;
  var script = document.createElement('script');

  if (this.script) {
    this.script.parentNode.removeChild(this.script);
    this.script = null;
  }

  script.async = true;
  script.src = this.uri();
  script.onerror = function (e) {
    self.onError('jsonp poll error', e);
  };

  var insertAt = document.getElementsByTagName('script')[0];
  if (insertAt) {
    insertAt.parentNode.insertBefore(script, insertAt);
  } else {
    (document.head || document.body).appendChild(script);
  }
  this.script = script;

  var isUAgecko = 'undefined' !== typeof navigator && /gecko/i.test(navigator.userAgent);

  if (isUAgecko) {
    setTimeout(function () {
      var iframe = document.createElement('iframe');
      document.body.appendChild(iframe);
      document.body.removeChild(iframe);
    }, 100);
  }
};

/**
 * Writes with a hidden iframe.
 *
 * @param {String} data to send
 * @param {Function} called upon flush.
 * @api private
 */

JSONPPolling.prototype.doWrite = function (data, fn) {
  var self = this;

  if (!this.form) {
    var form = document.createElement('form');
    var area = document.createElement('textarea');
    var id = this.iframeId = 'eio_iframe_' + this.index;
    var iframe;

    form.className = 'socketio';
    form.style.position = 'absolute';
    form.style.top = '-1000px';
    form.style.left = '-1000px';
    form.target = id;
    form.method = 'POST';
    form.setAttribute('accept-charset', 'utf-8');
    area.name = 'd';
    form.appendChild(area);
    document.body.appendChild(form);

    this.form = form;
    this.area = area;
  }

  this.form.action = this.uri();

  function complete () {
    initIframe();
    fn();
  }

  function initIframe () {
    if (self.iframe) {
      try {
        self.form.removeChild(self.iframe);
      } catch (e) {
        self.onError('jsonp polling iframe removal error', e);
      }
    }

    try {
      // ie6 dynamic iframes with target="" support (thanks Chris Lambacher)
      var html = '<iframe src="javascript:0" name="' + self.iframeId + '">';
      iframe = document.createElement(html);
    } catch (e) {
      iframe = document.createElement('iframe');
      iframe.name = self.iframeId;
      iframe.src = 'javascript:0';
    }

    iframe.id = self.iframeId;

    self.form.appendChild(iframe);
    self.iframe = iframe;
  }

  initIframe();

  // escape \n to prevent it from being converted into \r\n by some UAs
  // double escaping is required for escaped new lines because unescaping of new lines can be done safely on server-side
  data = data.replace(rEscapedNewline, '\\\n');
  this.area.value = data.replace(rNewline, '\\n');

  try {
    this.form.submit();
  } catch (e) {}

  if (this.iframe.attachEvent) {
    this.iframe.onreadystatechange = function () {
      if (self.iframe.readyState === 'complete') {
        complete();
      }
    };
  } else {
    this.iframe.onload = complete;
  }
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./polling":18,"component-inherit":11}],17:[function(require,module,exports){
/* global attachEvent */

/**
 * Module requirements.
 */

var XMLHttpRequest = require('xmlhttprequest-ssl');
var Polling = require('./polling');
var Emitter = require('component-emitter');
var inherit = require('component-inherit');
var debug = require('debug')('engine.io-client:polling-xhr');

/**
 * Module exports.
 */

module.exports = XHR;
module.exports.Request = Request;

/**
 * Empty function
 */

function empty () {}

/**
 * XHR Polling constructor.
 *
 * @param {Object} opts
 * @api public
 */

function XHR (opts) {
  Polling.call(this, opts);
  this.requestTimeout = opts.requestTimeout;
  this.extraHeaders = opts.extraHeaders;

  if (typeof location !== 'undefined') {
    var isSSL = 'https:' === location.protocol;
    var port = location.port;

    // some user agents have empty `location.port`
    if (!port) {
      port = isSSL ? 443 : 80;
    }

    this.xd = (typeof location !== 'undefined' && opts.hostname !== location.hostname) ||
      port !== opts.port;
    this.xs = opts.secure !== isSSL;
  }
}

/**
 * Inherits from Polling.
 */

inherit(XHR, Polling);

/**
 * XHR supports binary
 */

XHR.prototype.supportsBinary = true;

/**
 * Creates a request.
 *
 * @param {String} method
 * @api private
 */

XHR.prototype.request = function (opts) {
  opts = opts || {};
  opts.uri = this.uri();
  opts.xd = this.xd;
  opts.xs = this.xs;
  opts.agent = this.agent || false;
  opts.supportsBinary = this.supportsBinary;
  opts.enablesXDR = this.enablesXDR;

  // SSL options for Node.js client
  opts.pfx = this.pfx;
  opts.key = this.key;
  opts.passphrase = this.passphrase;
  opts.cert = this.cert;
  opts.ca = this.ca;
  opts.ciphers = this.ciphers;
  opts.rejectUnauthorized = this.rejectUnauthorized;
  opts.requestTimeout = this.requestTimeout;

  // other options for Node.js client
  opts.extraHeaders = this.extraHeaders;

  return new Request(opts);
};

/**
 * Sends data.
 *
 * @param {String} data to send.
 * @param {Function} called upon flush.
 * @api private
 */

XHR.prototype.doWrite = function (data, fn) {
  var isBinary = typeof data !== 'string' && data !== undefined;
  var req = this.request({ method: 'POST', data: data, isBinary: isBinary });
  var self = this;
  req.on('success', fn);
  req.on('error', function (err) {
    self.onError('xhr post error', err);
  });
  this.sendXhr = req;
};

/**
 * Starts a poll cycle.
 *
 * @api private
 */

XHR.prototype.doPoll = function () {
  debug('xhr poll');
  var req = this.request();
  var self = this;
  req.on('data', function (data) {
    self.onData(data);
  });
  req.on('error', function (err) {
    self.onError('xhr poll error', err);
  });
  this.pollXhr = req;
};

/**
 * Request constructor
 *
 * @param {Object} options
 * @api public
 */

function Request (opts) {
  this.method = opts.method || 'GET';
  this.uri = opts.uri;
  this.xd = !!opts.xd;
  this.xs = !!opts.xs;
  this.async = false !== opts.async;
  this.data = undefined !== opts.data ? opts.data : null;
  this.agent = opts.agent;
  this.isBinary = opts.isBinary;
  this.supportsBinary = opts.supportsBinary;
  this.enablesXDR = opts.enablesXDR;
  this.requestTimeout = opts.requestTimeout;

  // SSL options for Node.js client
  this.pfx = opts.pfx;
  this.key = opts.key;
  this.passphrase = opts.passphrase;
  this.cert = opts.cert;
  this.ca = opts.ca;
  this.ciphers = opts.ciphers;
  this.rejectUnauthorized = opts.rejectUnauthorized;

  // other options for Node.js client
  this.extraHeaders = opts.extraHeaders;

  this.create();
}

/**
 * Mix in `Emitter`.
 */

Emitter(Request.prototype);

/**
 * Creates the XHR object and sends the request.
 *
 * @api private
 */

Request.prototype.create = function () {
  var opts = { agent: this.agent, xdomain: this.xd, xscheme: this.xs, enablesXDR: this.enablesXDR };

  // SSL options for Node.js client
  opts.pfx = this.pfx;
  opts.key = this.key;
  opts.passphrase = this.passphrase;
  opts.cert = this.cert;
  opts.ca = this.ca;
  opts.ciphers = this.ciphers;
  opts.rejectUnauthorized = this.rejectUnauthorized;

  var xhr = this.xhr = new XMLHttpRequest(opts);
  var self = this;

  try {
    debug('xhr open %s: %s', this.method, this.uri);
    xhr.open(this.method, this.uri, this.async);
    try {
      if (this.extraHeaders) {
        xhr.setDisableHeaderCheck && xhr.setDisableHeaderCheck(true);
        for (var i in this.extraHeaders) {
          if (this.extraHeaders.hasOwnProperty(i)) {
            xhr.setRequestHeader(i, this.extraHeaders[i]);
          }
        }
      }
    } catch (e) {}

    if ('POST' === this.method) {
      try {
        if (this.isBinary) {
          xhr.setRequestHeader('Content-type', 'application/octet-stream');
        } else {
          xhr.setRequestHeader('Content-type', 'text/plain;charset=UTF-8');
        }
      } catch (e) {}
    }

    try {
      xhr.setRequestHeader('Accept', '*/*');
    } catch (e) {}

    // ie6 check
    if ('withCredentials' in xhr) {
      xhr.withCredentials = true;
    }

    if (this.requestTimeout) {
      xhr.timeout = this.requestTimeout;
    }

    if (this.hasXDR()) {
      xhr.onload = function () {
        self.onLoad();
      };
      xhr.onerror = function () {
        self.onError(xhr.responseText);
      };
    } else {
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 2) {
          try {
            var contentType = xhr.getResponseHeader('Content-Type');
            if (self.supportsBinary && contentType === 'application/octet-stream') {
              xhr.responseType = 'arraybuffer';
            }
          } catch (e) {}
        }
        if (4 !== xhr.readyState) return;
        if (200 === xhr.status || 1223 === xhr.status) {
          self.onLoad();
        } else {
          // make sure the `error` event handler that's user-set
          // does not throw in the same tick and gets caught here
          setTimeout(function () {
            self.onError(xhr.status);
          }, 0);
        }
      };
    }

    debug('xhr data %s', this.data);
    xhr.send(this.data);
  } catch (e) {
    // Need to defer since .create() is called directly fhrom the constructor
    // and thus the 'error' event can only be only bound *after* this exception
    // occurs.  Therefore, also, we cannot throw here at all.
    setTimeout(function () {
      self.onError(e);
    }, 0);
    return;
  }

  if (typeof document !== 'undefined') {
    this.index = Request.requestsCount++;
    Request.requests[this.index] = this;
  }
};

/**
 * Called upon successful response.
 *
 * @api private
 */

Request.prototype.onSuccess = function () {
  this.emit('success');
  this.cleanup();
};

/**
 * Called if we have data.
 *
 * @api private
 */

Request.prototype.onData = function (data) {
  this.emit('data', data);
  this.onSuccess();
};

/**
 * Called upon error.
 *
 * @api private
 */

Request.prototype.onError = function (err) {
  this.emit('error', err);
  this.cleanup(true);
};

/**
 * Cleans up house.
 *
 * @api private
 */

Request.prototype.cleanup = function (fromError) {
  if ('undefined' === typeof this.xhr || null === this.xhr) {
    return;
  }
  // xmlhttprequest
  if (this.hasXDR()) {
    this.xhr.onload = this.xhr.onerror = empty;
  } else {
    this.xhr.onreadystatechange = empty;
  }

  if (fromError) {
    try {
      this.xhr.abort();
    } catch (e) {}
  }

  if (typeof document !== 'undefined') {
    delete Request.requests[this.index];
  }

  this.xhr = null;
};

/**
 * Called upon load.
 *
 * @api private
 */

Request.prototype.onLoad = function () {
  var data;
  try {
    var contentType;
    try {
      contentType = this.xhr.getResponseHeader('Content-Type');
    } catch (e) {}
    if (contentType === 'application/octet-stream') {
      data = this.xhr.response || this.xhr.responseText;
    } else {
      data = this.xhr.responseText;
    }
  } catch (e) {
    this.onError(e);
  }
  if (null != data) {
    this.onData(data);
  }
};

/**
 * Check if it has XDomainRequest.
 *
 * @api private
 */

Request.prototype.hasXDR = function () {
  return typeof XDomainRequest !== 'undefined' && !this.xs && this.enablesXDR;
};

/**
 * Aborts the request.
 *
 * @api public
 */

Request.prototype.abort = function () {
  this.cleanup();
};

/**
 * Aborts pending requests when unloading the window. This is needed to prevent
 * memory leaks (e.g. when using IE) and to ensure that no spurious error is
 * emitted.
 */

Request.requestsCount = 0;
Request.requests = {};

if (typeof document !== 'undefined') {
  if (typeof attachEvent === 'function') {
    attachEvent('onunload', unloadHandler);
  } else if (typeof addEventListener === 'function') {
    var terminationEvent = 'onpagehide' in self ? 'pagehide' : 'unload';
    addEventListener(terminationEvent, unloadHandler, false);
  }
}

function unloadHandler () {
  for (var i in Request.requests) {
    if (Request.requests.hasOwnProperty(i)) {
      Request.requests[i].abort();
    }
  }
}

},{"./polling":18,"component-emitter":10,"component-inherit":11,"debug":21,"xmlhttprequest-ssl":20}],18:[function(require,module,exports){
/**
 * Module dependencies.
 */

var Transport = require('../transport');
var parseqs = require('parseqs');
var parser = require('engine.io-parser');
var inherit = require('component-inherit');
var yeast = require('yeast');
var debug = require('debug')('engine.io-client:polling');

/**
 * Module exports.
 */

module.exports = Polling;

/**
 * Is XHR2 supported?
 */

var hasXHR2 = (function () {
  var XMLHttpRequest = require('xmlhttprequest-ssl');
  var xhr = new XMLHttpRequest({ xdomain: false });
  return null != xhr.responseType;
})();

/**
 * Polling interface.
 *
 * @param {Object} opts
 * @api private
 */

function Polling (opts) {
  var forceBase64 = (opts && opts.forceBase64);
  if (!hasXHR2 || forceBase64) {
    this.supportsBinary = false;
  }
  Transport.call(this, opts);
}

/**
 * Inherits from Transport.
 */

inherit(Polling, Transport);

/**
 * Transport name.
 */

Polling.prototype.name = 'polling';

/**
 * Opens the socket (triggers polling). We write a PING message to determine
 * when the transport is open.
 *
 * @api private
 */

Polling.prototype.doOpen = function () {
  this.poll();
};

/**
 * Pauses polling.
 *
 * @param {Function} callback upon buffers are flushed and transport is paused
 * @api private
 */

Polling.prototype.pause = function (onPause) {
  var self = this;

  this.readyState = 'pausing';

  function pause () {
    debug('paused');
    self.readyState = 'paused';
    onPause();
  }

  if (this.polling || !this.writable) {
    var total = 0;

    if (this.polling) {
      debug('we are currently polling - waiting to pause');
      total++;
      this.once('pollComplete', function () {
        debug('pre-pause polling complete');
        --total || pause();
      });
    }

    if (!this.writable) {
      debug('we are currently writing - waiting to pause');
      total++;
      this.once('drain', function () {
        debug('pre-pause writing complete');
        --total || pause();
      });
    }
  } else {
    pause();
  }
};

/**
 * Starts polling cycle.
 *
 * @api public
 */

Polling.prototype.poll = function () {
  debug('polling');
  this.polling = true;
  this.doPoll();
  this.emit('poll');
};

/**
 * Overloads onData to detect payloads.
 *
 * @api private
 */

Polling.prototype.onData = function (data) {
  var self = this;
  debug('polling got data %s', data);
  var callback = function (packet, index, total) {
    // if its the first message we consider the transport open
    if ('opening' === self.readyState) {
      self.onOpen();
    }

    // if its a close packet, we close the ongoing requests
    if ('close' === packet.type) {
      self.onClose();
      return false;
    }

    // otherwise bypass onData and handle the message
    self.onPacket(packet);
  };

  // decode payload
  parser.decodePayload(data, this.socket.binaryType, callback);

  // if an event did not trigger closing
  if ('closed' !== this.readyState) {
    // if we got data we're not polling
    this.polling = false;
    this.emit('pollComplete');

    if ('open' === this.readyState) {
      this.poll();
    } else {
      debug('ignoring poll - transport state "%s"', this.readyState);
    }
  }
};

/**
 * For polling, send a close packet.
 *
 * @api private
 */

Polling.prototype.doClose = function () {
  var self = this;

  function close () {
    debug('writing close packet');
    self.write([{ type: 'close' }]);
  }

  if ('open' === this.readyState) {
    debug('transport open - closing');
    close();
  } else {
    // in case we're trying to close while
    // handshaking is in progress (GH-164)
    debug('transport not open - deferring close');
    this.once('open', close);
  }
};

/**
 * Writes a packets payload.
 *
 * @param {Array} data packets
 * @param {Function} drain callback
 * @api private
 */

Polling.prototype.write = function (packets) {
  var self = this;
  this.writable = false;
  var callbackfn = function () {
    self.writable = true;
    self.emit('drain');
  };

  parser.encodePayload(packets, this.supportsBinary, function (data) {
    self.doWrite(data, callbackfn);
  });
};

/**
 * Generates uri for connection.
 *
 * @api private
 */

Polling.prototype.uri = function () {
  var query = this.query || {};
  var schema = this.secure ? 'https' : 'http';
  var port = '';

  // cache busting is forced
  if (false !== this.timestampRequests) {
    query[this.timestampParam] = yeast();
  }

  if (!this.supportsBinary && !query.sid) {
    query.b64 = 1;
  }

  query = parseqs.encode(query);

  // avoid port if default for schema
  if (this.port && (('https' === schema && Number(this.port) !== 443) ||
     ('http' === schema && Number(this.port) !== 80))) {
    port = ':' + this.port;
  }

  // prepend ? to query
  if (query.length) {
    query = '?' + query;
  }

  var ipv6 = this.hostname.indexOf(':') !== -1;
  return schema + '://' + (ipv6 ? '[' + this.hostname + ']' : this.hostname) + port + this.path + query;
};

},{"../transport":14,"component-inherit":11,"debug":21,"engine.io-parser":23,"parseqs":32,"xmlhttprequest-ssl":20,"yeast":49}],19:[function(require,module,exports){
(function (Buffer){
/**
 * Module dependencies.
 */

var Transport = require('../transport');
var parser = require('engine.io-parser');
var parseqs = require('parseqs');
var inherit = require('component-inherit');
var yeast = require('yeast');
var debug = require('debug')('engine.io-client:websocket');

var BrowserWebSocket, NodeWebSocket;

if (typeof WebSocket !== 'undefined') {
  BrowserWebSocket = WebSocket;
} else if (typeof self !== 'undefined') {
  BrowserWebSocket = self.WebSocket || self.MozWebSocket;
} else {
  try {
    NodeWebSocket = require('ws');
  } catch (e) { }
}

/**
 * Get either the `WebSocket` or `MozWebSocket` globals
 * in the browser or try to resolve WebSocket-compatible
 * interface exposed by `ws` for Node-like environment.
 */

var WebSocketImpl = BrowserWebSocket || NodeWebSocket;

/**
 * Module exports.
 */

module.exports = WS;

/**
 * WebSocket transport constructor.
 *
 * @api {Object} connection options
 * @api public
 */

function WS (opts) {
  var forceBase64 = (opts && opts.forceBase64);
  if (forceBase64) {
    this.supportsBinary = false;
  }
  this.perMessageDeflate = opts.perMessageDeflate;
  this.usingBrowserWebSocket = BrowserWebSocket && !opts.forceNode;
  this.protocols = opts.protocols;
  if (!this.usingBrowserWebSocket) {
    WebSocketImpl = NodeWebSocket;
  }
  Transport.call(this, opts);
}

/**
 * Inherits from Transport.
 */

inherit(WS, Transport);

/**
 * Transport name.
 *
 * @api public
 */

WS.prototype.name = 'websocket';

/*
 * WebSockets support binary
 */

WS.prototype.supportsBinary = true;

/**
 * Opens socket.
 *
 * @api private
 */

WS.prototype.doOpen = function () {
  if (!this.check()) {
    // let probe timeout
    return;
  }

  var uri = this.uri();
  var protocols = this.protocols;
  var opts = {
    agent: this.agent,
    perMessageDeflate: this.perMessageDeflate
  };

  // SSL options for Node.js client
  opts.pfx = this.pfx;
  opts.key = this.key;
  opts.passphrase = this.passphrase;
  opts.cert = this.cert;
  opts.ca = this.ca;
  opts.ciphers = this.ciphers;
  opts.rejectUnauthorized = this.rejectUnauthorized;
  if (this.extraHeaders) {
    opts.headers = this.extraHeaders;
  }
  if (this.localAddress) {
    opts.localAddress = this.localAddress;
  }

  try {
    this.ws =
      this.usingBrowserWebSocket && !this.isReactNative
        ? protocols
          ? new WebSocketImpl(uri, protocols)
          : new WebSocketImpl(uri)
        : new WebSocketImpl(uri, protocols, opts);
  } catch (err) {
    return this.emit('error', err);
  }

  if (this.ws.binaryType === undefined) {
    this.supportsBinary = false;
  }

  if (this.ws.supports && this.ws.supports.binary) {
    this.supportsBinary = true;
    this.ws.binaryType = 'nodebuffer';
  } else {
    this.ws.binaryType = 'arraybuffer';
  }

  this.addEventListeners();
};

/**
 * Adds event listeners to the socket
 *
 * @api private
 */

WS.prototype.addEventListeners = function () {
  var self = this;

  this.ws.onopen = function () {
    self.onOpen();
  };
  this.ws.onclose = function () {
    self.onClose();
  };
  this.ws.onmessage = function (ev) {
    self.onData(ev.data);
  };
  this.ws.onerror = function (e) {
    self.onError('websocket error', e);
  };
};

/**
 * Writes data to socket.
 *
 * @param {Array} array of packets.
 * @api private
 */

WS.prototype.write = function (packets) {
  var self = this;
  this.writable = false;

  // encodePacket efficient as it uses WS framing
  // no need for encodePayload
  var total = packets.length;
  for (var i = 0, l = total; i < l; i++) {
    (function (packet) {
      parser.encodePacket(packet, self.supportsBinary, function (data) {
        if (!self.usingBrowserWebSocket) {
          // always create a new object (GH-437)
          var opts = {};
          if (packet.options) {
            opts.compress = packet.options.compress;
          }

          if (self.perMessageDeflate) {
            var len = 'string' === typeof data ? Buffer.byteLength(data) : data.length;
            if (len < self.perMessageDeflate.threshold) {
              opts.compress = false;
            }
          }
        }

        // Sometimes the websocket has already been closed but the browser didn't
        // have a chance of informing us about it yet, in that case send will
        // throw an error
        try {
          if (self.usingBrowserWebSocket) {
            // TypeError is thrown when passing the second argument on Safari
            self.ws.send(data);
          } else {
            self.ws.send(data, opts);
          }
        } catch (e) {
          debug('websocket closed before onclose event');
        }

        --total || done();
      });
    })(packets[i]);
  }

  function done () {
    self.emit('flush');

    // fake drain
    // defer to next tick to allow Socket to clear writeBuffer
    setTimeout(function () {
      self.writable = true;
      self.emit('drain');
    }, 0);
  }
};

/**
 * Called upon close
 *
 * @api private
 */

WS.prototype.onClose = function () {
  Transport.prototype.onClose.call(this);
};

/**
 * Closes socket.
 *
 * @api private
 */

WS.prototype.doClose = function () {
  if (typeof this.ws !== 'undefined') {
    this.ws.close();
  }
};

/**
 * Generates uri for connection.
 *
 * @api private
 */

WS.prototype.uri = function () {
  var query = this.query || {};
  var schema = this.secure ? 'wss' : 'ws';
  var port = '';

  // avoid port if default for schema
  if (this.port && (('wss' === schema && Number(this.port) !== 443) ||
    ('ws' === schema && Number(this.port) !== 80))) {
    port = ':' + this.port;
  }

  // append timestamp to URI
  if (this.timestampRequests) {
    query[this.timestampParam] = yeast();
  }

  // communicate binary support capabilities
  if (!this.supportsBinary) {
    query.b64 = 1;
  }

  query = parseqs.encode(query);

  // prepend ? to query
  if (query.length) {
    query = '?' + query;
  }

  var ipv6 = this.hostname.indexOf(':') !== -1;
  return schema + '://' + (ipv6 ? '[' + this.hostname + ']' : this.hostname) + port + this.path + query;
};

/**
 * Feature detection for WebSocket.
 *
 * @return {Boolean} whether this transport is available.
 * @api public
 */

WS.prototype.check = function () {
  return !!WebSocketImpl && !('__initialize' in WebSocketImpl && this.name === WS.prototype.name);
};

}).call(this,require("buffer").Buffer)
},{"../transport":14,"buffer":8,"component-inherit":11,"debug":21,"engine.io-parser":23,"parseqs":32,"ws":7,"yeast":49}],20:[function(require,module,exports){
// browser shim for xmlhttprequest module

var hasCORS = require('has-cors');

module.exports = function (opts) {
  var xdomain = opts.xdomain;

  // scheme must be same when usign XDomainRequest
  // http://blogs.msdn.com/b/ieinternals/archive/2010/05/13/xdomainrequest-restrictions-limitations-and-workarounds.aspx
  var xscheme = opts.xscheme;

  // XDomainRequest has a flow of not sending cookie, therefore it should be disabled as a default.
  // https://github.com/Automattic/engine.io-client/pull/217
  var enablesXDR = opts.enablesXDR;

  // XMLHttpRequest can be disabled on IE
  try {
    if ('undefined' !== typeof XMLHttpRequest && (!xdomain || hasCORS)) {
      return new XMLHttpRequest();
    }
  } catch (e) { }

  // Use XDomainRequest for IE8 if enablesXDR is true
  // because loading bar keeps flashing when using jsonp-polling
  // https://github.com/yujiosaka/socke.io-ie8-loading-example
  try {
    if ('undefined' !== typeof XDomainRequest && !xscheme && enablesXDR) {
      return new XDomainRequest();
    }
  } catch (e) { }

  if (!xdomain) {
    try {
      return new self[['Active'].concat('Object').join('X')]('Microsoft.XMLHTTP');
    } catch (e) { }
  }
};

},{"has-cors":27}],21:[function(require,module,exports){
(function (process){
/**
 * This is the web browser implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = require('./debug');
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = 'undefined' != typeof chrome
               && 'undefined' != typeof chrome.storage
                  ? chrome.storage.local
                  : localstorage();

/**
 * Colors.
 */

exports.colors = [
  '#0000CC', '#0000FF', '#0033CC', '#0033FF', '#0066CC', '#0066FF', '#0099CC',
  '#0099FF', '#00CC00', '#00CC33', '#00CC66', '#00CC99', '#00CCCC', '#00CCFF',
  '#3300CC', '#3300FF', '#3333CC', '#3333FF', '#3366CC', '#3366FF', '#3399CC',
  '#3399FF', '#33CC00', '#33CC33', '#33CC66', '#33CC99', '#33CCCC', '#33CCFF',
  '#6600CC', '#6600FF', '#6633CC', '#6633FF', '#66CC00', '#66CC33', '#9900CC',
  '#9900FF', '#9933CC', '#9933FF', '#99CC00', '#99CC33', '#CC0000', '#CC0033',
  '#CC0066', '#CC0099', '#CC00CC', '#CC00FF', '#CC3300', '#CC3333', '#CC3366',
  '#CC3399', '#CC33CC', '#CC33FF', '#CC6600', '#CC6633', '#CC9900', '#CC9933',
  '#CCCC00', '#CCCC33', '#FF0000', '#FF0033', '#FF0066', '#FF0099', '#FF00CC',
  '#FF00FF', '#FF3300', '#FF3333', '#FF3366', '#FF3399', '#FF33CC', '#FF33FF',
  '#FF6600', '#FF6633', '#FF9900', '#FF9933', '#FFCC00', '#FFCC33'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

function useColors() {
  // NB: In an Electron preload script, document will be defined but not fully
  // initialized. Since we know we're in Chrome, we'll just detect this case
  // explicitly
  if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
    return true;
  }

  // Internet Explorer and Edge do not support colors.
  if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
    return false;
  }

  // is webkit? http://stackoverflow.com/a/16459606/376773
  // document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
  return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
    // is firebug? http://stackoverflow.com/a/398120/376773
    (typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
    // is firefox >= v31?
    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||
    // double check webkit in userAgent just in case we are in a worker
    (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
}

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

exports.formatters.j = function(v) {
  try {
    return JSON.stringify(v);
  } catch (err) {
    return '[UnexpectedJSONParseError]: ' + err.message;
  }
};


/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs(args) {
  var useColors = this.useColors;

  args[0] = (useColors ? '%c' : '')
    + this.namespace
    + (useColors ? ' %c' : ' ')
    + args[0]
    + (useColors ? '%c ' : ' ')
    + '+' + exports.humanize(this.diff);

  if (!useColors) return;

  var c = 'color: ' + this.color;
  args.splice(1, 0, c, 'color: inherit')

  // the final "%c" is somewhat tricky, because there could be other
  // arguments passed either before or after the %c, so we need to
  // figure out the correct index to insert the CSS into
  var index = 0;
  var lastC = 0;
  args[0].replace(/%[a-zA-Z%]/g, function(match) {
    if ('%%' === match) return;
    index++;
    if ('%c' === match) {
      // we only are interested in the *last* %c
      // (the user may have provided their own)
      lastC = index;
    }
  });

  args.splice(lastC, 0, c);
}

/**
 * Invokes `console.log()` when available.
 * No-op when `console.log` is not a "function".
 *
 * @api public
 */

function log() {
  // this hackery is required for IE8/9, where
  // the `console.log` function doesn't have 'apply'
  return 'object' === typeof console
    && console.log
    && Function.prototype.apply.call(console.log, console, arguments);
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */

function save(namespaces) {
  try {
    if (null == namespaces) {
      exports.storage.removeItem('debug');
    } else {
      exports.storage.debug = namespaces;
    }
  } catch(e) {}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
  var r;
  try {
    r = exports.storage.debug;
  } catch(e) {}

  // If debug isn't set in LS, and we're in Electron, try to load $DEBUG
  if (!r && typeof process !== 'undefined' && 'env' in process) {
    r = process.env.DEBUG;
  }

  return r;
}

/**
 * Enable namespaces listed in `localStorage.debug` initially.
 */

exports.enable(load());

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage() {
  try {
    return window.localStorage;
  } catch (e) {}
}

}).call(this,require('_process'))
},{"./debug":22,"_process":34}],22:[function(require,module,exports){

/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = createDebug.debug = createDebug['default'] = createDebug;
exports.coerce = coerce;
exports.disable = disable;
exports.enable = enable;
exports.enabled = enabled;
exports.humanize = require('ms');

/**
 * Active `debug` instances.
 */
exports.instances = [];

/**
 * The currently active debug mode names, and names to skip.
 */

exports.names = [];
exports.skips = [];

/**
 * Map of special "%n" handling functions, for the debug "format" argument.
 *
 * Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
 */

exports.formatters = {};

/**
 * Select a color.
 * @param {String} namespace
 * @return {Number}
 * @api private
 */

function selectColor(namespace) {
  var hash = 0, i;

  for (i in namespace) {
    hash  = ((hash << 5) - hash) + namespace.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }

  return exports.colors[Math.abs(hash) % exports.colors.length];
}

/**
 * Create a debugger with the given `namespace`.
 *
 * @param {String} namespace
 * @return {Function}
 * @api public
 */

function createDebug(namespace) {

  var prevTime;

  function debug() {
    // disabled?
    if (!debug.enabled) return;

    var self = debug;

    // set `diff` timestamp
    var curr = +new Date();
    var ms = curr - (prevTime || curr);
    self.diff = ms;
    self.prev = prevTime;
    self.curr = curr;
    prevTime = curr;

    // turn the `arguments` into a proper Array
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }

    args[0] = exports.coerce(args[0]);

    if ('string' !== typeof args[0]) {
      // anything else let's inspect with %O
      args.unshift('%O');
    }

    // apply any `formatters` transformations
    var index = 0;
    args[0] = args[0].replace(/%([a-zA-Z%])/g, function(match, format) {
      // if we encounter an escaped % then don't increase the array index
      if (match === '%%') return match;
      index++;
      var formatter = exports.formatters[format];
      if ('function' === typeof formatter) {
        var val = args[index];
        match = formatter.call(self, val);

        // now we need to remove `args[index]` since it's inlined in the `format`
        args.splice(index, 1);
        index--;
      }
      return match;
    });

    // apply env-specific formatting (colors, etc.)
    exports.formatArgs.call(self, args);

    var logFn = debug.log || exports.log || console.log.bind(console);
    logFn.apply(self, args);
  }

  debug.namespace = namespace;
  debug.enabled = exports.enabled(namespace);
  debug.useColors = exports.useColors();
  debug.color = selectColor(namespace);
  debug.destroy = destroy;

  // env-specific initialization logic for debug instances
  if ('function' === typeof exports.init) {
    exports.init(debug);
  }

  exports.instances.push(debug);

  return debug;
}

function destroy () {
  var index = exports.instances.indexOf(this);
  if (index !== -1) {
    exports.instances.splice(index, 1);
    return true;
  } else {
    return false;
  }
}

/**
 * Enables a debug mode by namespaces. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} namespaces
 * @api public
 */

function enable(namespaces) {
  exports.save(namespaces);

  exports.names = [];
  exports.skips = [];

  var i;
  var split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
  var len = split.length;

  for (i = 0; i < len; i++) {
    if (!split[i]) continue; // ignore empty strings
    namespaces = split[i].replace(/\*/g, '.*?');
    if (namespaces[0] === '-') {
      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    } else {
      exports.names.push(new RegExp('^' + namespaces + '$'));
    }
  }

  for (i = 0; i < exports.instances.length; i++) {
    var instance = exports.instances[i];
    instance.enabled = exports.enabled(instance.namespace);
  }
}

/**
 * Disable debug output.
 *
 * @api public
 */

function disable() {
  exports.enable('');
}

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

function enabled(name) {
  if (name[name.length - 1] === '*') {
    return true;
  }
  var i, len;
  for (i = 0, len = exports.skips.length; i < len; i++) {
    if (exports.skips[i].test(name)) {
      return false;
    }
  }
  for (i = 0, len = exports.names.length; i < len; i++) {
    if (exports.names[i].test(name)) {
      return true;
    }
  }
  return false;
}

/**
 * Coerce `val`.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

},{"ms":31}],23:[function(require,module,exports){
/**
 * Module dependencies.
 */

var keys = require('./keys');
var hasBinary = require('has-binary2');
var sliceBuffer = require('arraybuffer.slice');
var after = require('after');
var utf8 = require('./utf8');

var base64encoder;
if (typeof ArrayBuffer !== 'undefined') {
  base64encoder = require('base64-arraybuffer');
}

/**
 * Check if we are running an android browser. That requires us to use
 * ArrayBuffer with polling transports...
 *
 * http://ghinda.net/jpeg-blob-ajax-android/
 */

var isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);

/**
 * Check if we are running in PhantomJS.
 * Uploading a Blob with PhantomJS does not work correctly, as reported here:
 * https://github.com/ariya/phantomjs/issues/11395
 * @type boolean
 */
var isPhantomJS = typeof navigator !== 'undefined' && /PhantomJS/i.test(navigator.userAgent);

/**
 * When true, avoids using Blobs to encode payloads.
 * @type boolean
 */
var dontSendBlobs = isAndroid || isPhantomJS;

/**
 * Current protocol version.
 */

exports.protocol = 3;

/**
 * Packet types.
 */

var packets = exports.packets = {
    open:     0    // non-ws
  , close:    1    // non-ws
  , ping:     2
  , pong:     3
  , message:  4
  , upgrade:  5
  , noop:     6
};

var packetslist = keys(packets);

/**
 * Premade error packet.
 */

var err = { type: 'error', data: 'parser error' };

/**
 * Create a blob api even for blob builder when vendor prefixes exist
 */

var Blob = require('blob');

/**
 * Encodes a packet.
 *
 *     <packet type id> [ <data> ]
 *
 * Example:
 *
 *     5hello world
 *     3
 *     4
 *
 * Binary is encoded in an identical principle
 *
 * @api private
 */

exports.encodePacket = function (packet, supportsBinary, utf8encode, callback) {
  if (typeof supportsBinary === 'function') {
    callback = supportsBinary;
    supportsBinary = false;
  }

  if (typeof utf8encode === 'function') {
    callback = utf8encode;
    utf8encode = null;
  }

  var data = (packet.data === undefined)
    ? undefined
    : packet.data.buffer || packet.data;

  if (typeof ArrayBuffer !== 'undefined' && data instanceof ArrayBuffer) {
    return encodeArrayBuffer(packet, supportsBinary, callback);
  } else if (typeof Blob !== 'undefined' && data instanceof Blob) {
    return encodeBlob(packet, supportsBinary, callback);
  }

  // might be an object with { base64: true, data: dataAsBase64String }
  if (data && data.base64) {
    return encodeBase64Object(packet, callback);
  }

  // Sending data as a utf-8 string
  var encoded = packets[packet.type];

  // data fragment is optional
  if (undefined !== packet.data) {
    encoded += utf8encode ? utf8.encode(String(packet.data), { strict: false }) : String(packet.data);
  }

  return callback('' + encoded);

};

function encodeBase64Object(packet, callback) {
  // packet data is an object { base64: true, data: dataAsBase64String }
  var message = 'b' + exports.packets[packet.type] + packet.data.data;
  return callback(message);
}

/**
 * Encode packet helpers for binary types
 */

function encodeArrayBuffer(packet, supportsBinary, callback) {
  if (!supportsBinary) {
    return exports.encodeBase64Packet(packet, callback);
  }

  var data = packet.data;
  var contentArray = new Uint8Array(data);
  var resultBuffer = new Uint8Array(1 + data.byteLength);

  resultBuffer[0] = packets[packet.type];
  for (var i = 0; i < contentArray.length; i++) {
    resultBuffer[i+1] = contentArray[i];
  }

  return callback(resultBuffer.buffer);
}

function encodeBlobAsArrayBuffer(packet, supportsBinary, callback) {
  if (!supportsBinary) {
    return exports.encodeBase64Packet(packet, callback);
  }

  var fr = new FileReader();
  fr.onload = function() {
    exports.encodePacket({ type: packet.type, data: fr.result }, supportsBinary, true, callback);
  };
  return fr.readAsArrayBuffer(packet.data);
}

function encodeBlob(packet, supportsBinary, callback) {
  if (!supportsBinary) {
    return exports.encodeBase64Packet(packet, callback);
  }

  if (dontSendBlobs) {
    return encodeBlobAsArrayBuffer(packet, supportsBinary, callback);
  }

  var length = new Uint8Array(1);
  length[0] = packets[packet.type];
  var blob = new Blob([length.buffer, packet.data]);

  return callback(blob);
}

/**
 * Encodes a packet with binary data in a base64 string
 *
 * @param {Object} packet, has `type` and `data`
 * @return {String} base64 encoded message
 */

exports.encodeBase64Packet = function(packet, callback) {
  var message = 'b' + exports.packets[packet.type];
  if (typeof Blob !== 'undefined' && packet.data instanceof Blob) {
    var fr = new FileReader();
    fr.onload = function() {
      var b64 = fr.result.split(',')[1];
      callback(message + b64);
    };
    return fr.readAsDataURL(packet.data);
  }

  var b64data;
  try {
    b64data = String.fromCharCode.apply(null, new Uint8Array(packet.data));
  } catch (e) {
    // iPhone Safari doesn't let you apply with typed arrays
    var typed = new Uint8Array(packet.data);
    var basic = new Array(typed.length);
    for (var i = 0; i < typed.length; i++) {
      basic[i] = typed[i];
    }
    b64data = String.fromCharCode.apply(null, basic);
  }
  message += btoa(b64data);
  return callback(message);
};

/**
 * Decodes a packet. Changes format to Blob if requested.
 *
 * @return {Object} with `type` and `data` (if any)
 * @api private
 */

exports.decodePacket = function (data, binaryType, utf8decode) {
  if (data === undefined) {
    return err;
  }
  // String data
  if (typeof data === 'string') {
    if (data.charAt(0) === 'b') {
      return exports.decodeBase64Packet(data.substr(1), binaryType);
    }

    if (utf8decode) {
      data = tryDecode(data);
      if (data === false) {
        return err;
      }
    }
    var type = data.charAt(0);

    if (Number(type) != type || !packetslist[type]) {
      return err;
    }

    if (data.length > 1) {
      return { type: packetslist[type], data: data.substring(1) };
    } else {
      return { type: packetslist[type] };
    }
  }

  var asArray = new Uint8Array(data);
  var type = asArray[0];
  var rest = sliceBuffer(data, 1);
  if (Blob && binaryType === 'blob') {
    rest = new Blob([rest]);
  }
  return { type: packetslist[type], data: rest };
};

function tryDecode(data) {
  try {
    data = utf8.decode(data, { strict: false });
  } catch (e) {
    return false;
  }
  return data;
}

/**
 * Decodes a packet encoded in a base64 string
 *
 * @param {String} base64 encoded message
 * @return {Object} with `type` and `data` (if any)
 */

exports.decodeBase64Packet = function(msg, binaryType) {
  var type = packetslist[msg.charAt(0)];
  if (!base64encoder) {
    return { type: type, data: { base64: true, data: msg.substr(1) } };
  }

  var data = base64encoder.decode(msg.substr(1));

  if (binaryType === 'blob' && Blob) {
    data = new Blob([data]);
  }

  return { type: type, data: data };
};

/**
 * Encodes multiple messages (payload).
 *
 *     <length>:data
 *
 * Example:
 *
 *     11:hello world2:hi
 *
 * If any contents are binary, they will be encoded as base64 strings. Base64
 * encoded strings are marked with a b before the length specifier
 *
 * @param {Array} packets
 * @api private
 */

exports.encodePayload = function (packets, supportsBinary, callback) {
  if (typeof supportsBinary === 'function') {
    callback = supportsBinary;
    supportsBinary = null;
  }

  var isBinary = hasBinary(packets);

  if (supportsBinary && isBinary) {
    if (Blob && !dontSendBlobs) {
      return exports.encodePayloadAsBlob(packets, callback);
    }

    return exports.encodePayloadAsArrayBuffer(packets, callback);
  }

  if (!packets.length) {
    return callback('0:');
  }

  function setLengthHeader(message) {
    return message.length + ':' + message;
  }

  function encodeOne(packet, doneCallback) {
    exports.encodePacket(packet, !isBinary ? false : supportsBinary, false, function(message) {
      doneCallback(null, setLengthHeader(message));
    });
  }

  map(packets, encodeOne, function(err, results) {
    return callback(results.join(''));
  });
};

/**
 * Async array map using after
 */

function map(ary, each, done) {
  var result = new Array(ary.length);
  var next = after(ary.length, done);

  var eachWithIndex = function(i, el, cb) {
    each(el, function(error, msg) {
      result[i] = msg;
      cb(error, result);
    });
  };

  for (var i = 0; i < ary.length; i++) {
    eachWithIndex(i, ary[i], next);
  }
}

/*
 * Decodes data when a payload is maybe expected. Possible binary contents are
 * decoded from their base64 representation
 *
 * @param {String} data, callback method
 * @api public
 */

exports.decodePayload = function (data, binaryType, callback) {
  if (typeof data !== 'string') {
    return exports.decodePayloadAsBinary(data, binaryType, callback);
  }

  if (typeof binaryType === 'function') {
    callback = binaryType;
    binaryType = null;
  }

  var packet;
  if (data === '') {
    // parser error - ignoring payload
    return callback(err, 0, 1);
  }

  var length = '', n, msg;

  for (var i = 0, l = data.length; i < l; i++) {
    var chr = data.charAt(i);

    if (chr !== ':') {
      length += chr;
      continue;
    }

    if (length === '' || (length != (n = Number(length)))) {
      // parser error - ignoring payload
      return callback(err, 0, 1);
    }

    msg = data.substr(i + 1, n);

    if (length != msg.length) {
      // parser error - ignoring payload
      return callback(err, 0, 1);
    }

    if (msg.length) {
      packet = exports.decodePacket(msg, binaryType, false);

      if (err.type === packet.type && err.data === packet.data) {
        // parser error in individual packet - ignoring payload
        return callback(err, 0, 1);
      }

      var ret = callback(packet, i + n, l);
      if (false === ret) return;
    }

    // advance cursor
    i += n;
    length = '';
  }

  if (length !== '') {
    // parser error - ignoring payload
    return callback(err, 0, 1);
  }

};

/**
 * Encodes multiple messages (payload) as binary.
 *
 * <1 = binary, 0 = string><number from 0-9><number from 0-9>[...]<number
 * 255><data>
 *
 * Example:
 * 1 3 255 1 2 3, if the binary contents are interpreted as 8 bit integers
 *
 * @param {Array} packets
 * @return {ArrayBuffer} encoded payload
 * @api private
 */

exports.encodePayloadAsArrayBuffer = function(packets, callback) {
  if (!packets.length) {
    return callback(new ArrayBuffer(0));
  }

  function encodeOne(packet, doneCallback) {
    exports.encodePacket(packet, true, true, function(data) {
      return doneCallback(null, data);
    });
  }

  map(packets, encodeOne, function(err, encodedPackets) {
    var totalLength = encodedPackets.reduce(function(acc, p) {
      var len;
      if (typeof p === 'string'){
        len = p.length;
      } else {
        len = p.byteLength;
      }
      return acc + len.toString().length + len + 2; // string/binary identifier + separator = 2
    }, 0);

    var resultArray = new Uint8Array(totalLength);

    var bufferIndex = 0;
    encodedPackets.forEach(function(p) {
      var isString = typeof p === 'string';
      var ab = p;
      if (isString) {
        var view = new Uint8Array(p.length);
        for (var i = 0; i < p.length; i++) {
          view[i] = p.charCodeAt(i);
        }
        ab = view.buffer;
      }

      if (isString) { // not true binary
        resultArray[bufferIndex++] = 0;
      } else { // true binary
        resultArray[bufferIndex++] = 1;
      }

      var lenStr = ab.byteLength.toString();
      for (var i = 0; i < lenStr.length; i++) {
        resultArray[bufferIndex++] = parseInt(lenStr[i]);
      }
      resultArray[bufferIndex++] = 255;

      var view = new Uint8Array(ab);
      for (var i = 0; i < view.length; i++) {
        resultArray[bufferIndex++] = view[i];
      }
    });

    return callback(resultArray.buffer);
  });
};

/**
 * Encode as Blob
 */

exports.encodePayloadAsBlob = function(packets, callback) {
  function encodeOne(packet, doneCallback) {
    exports.encodePacket(packet, true, true, function(encoded) {
      var binaryIdentifier = new Uint8Array(1);
      binaryIdentifier[0] = 1;
      if (typeof encoded === 'string') {
        var view = new Uint8Array(encoded.length);
        for (var i = 0; i < encoded.length; i++) {
          view[i] = encoded.charCodeAt(i);
        }
        encoded = view.buffer;
        binaryIdentifier[0] = 0;
      }

      var len = (encoded instanceof ArrayBuffer)
        ? encoded.byteLength
        : encoded.size;

      var lenStr = len.toString();
      var lengthAry = new Uint8Array(lenStr.length + 1);
      for (var i = 0; i < lenStr.length; i++) {
        lengthAry[i] = parseInt(lenStr[i]);
      }
      lengthAry[lenStr.length] = 255;

      if (Blob) {
        var blob = new Blob([binaryIdentifier.buffer, lengthAry.buffer, encoded]);
        doneCallback(null, blob);
      }
    });
  }

  map(packets, encodeOne, function(err, results) {
    return callback(new Blob(results));
  });
};

/*
 * Decodes data when a payload is maybe expected. Strings are decoded by
 * interpreting each byte as a key code for entries marked to start with 0. See
 * description of encodePayloadAsBinary
 *
 * @param {ArrayBuffer} data, callback method
 * @api public
 */

exports.decodePayloadAsBinary = function (data, binaryType, callback) {
  if (typeof binaryType === 'function') {
    callback = binaryType;
    binaryType = null;
  }

  var bufferTail = data;
  var buffers = [];

  while (bufferTail.byteLength > 0) {
    var tailArray = new Uint8Array(bufferTail);
    var isString = tailArray[0] === 0;
    var msgLength = '';

    for (var i = 1; ; i++) {
      if (tailArray[i] === 255) break;

      // 310 = char length of Number.MAX_VALUE
      if (msgLength.length > 310) {
        return callback(err, 0, 1);
      }

      msgLength += tailArray[i];
    }

    bufferTail = sliceBuffer(bufferTail, 2 + msgLength.length);
    msgLength = parseInt(msgLength);

    var msg = sliceBuffer(bufferTail, 0, msgLength);
    if (isString) {
      try {
        msg = String.fromCharCode.apply(null, new Uint8Array(msg));
      } catch (e) {
        // iPhone Safari doesn't let you apply to typed arrays
        var typed = new Uint8Array(msg);
        msg = '';
        for (var i = 0; i < typed.length; i++) {
          msg += String.fromCharCode(typed[i]);
        }
      }
    }

    buffers.push(msg);
    bufferTail = sliceBuffer(bufferTail, msgLength);
  }

  var total = buffers.length;
  buffers.forEach(function(buffer, i) {
    callback(exports.decodePacket(buffer, binaryType, true), i, total);
  });
};

},{"./keys":24,"./utf8":25,"after":1,"arraybuffer.slice":2,"base64-arraybuffer":4,"blob":6,"has-binary2":26}],24:[function(require,module,exports){

/**
 * Gets the keys for an object.
 *
 * @return {Array} keys
 * @api private
 */

module.exports = Object.keys || function keys (obj){
  var arr = [];
  var has = Object.prototype.hasOwnProperty;

  for (var i in obj) {
    if (has.call(obj, i)) {
      arr.push(i);
    }
  }
  return arr;
};

},{}],25:[function(require,module,exports){
/*! https://mths.be/utf8js v2.1.2 by @mathias */

var stringFromCharCode = String.fromCharCode;

// Taken from https://mths.be/punycode
function ucs2decode(string) {
	var output = [];
	var counter = 0;
	var length = string.length;
	var value;
	var extra;
	while (counter < length) {
		value = string.charCodeAt(counter++);
		if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
			// high surrogate, and there is a next character
			extra = string.charCodeAt(counter++);
			if ((extra & 0xFC00) == 0xDC00) { // low surrogate
				output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
			} else {
				// unmatched surrogate; only append this code unit, in case the next
				// code unit is the high surrogate of a surrogate pair
				output.push(value);
				counter--;
			}
		} else {
			output.push(value);
		}
	}
	return output;
}

// Taken from https://mths.be/punycode
function ucs2encode(array) {
	var length = array.length;
	var index = -1;
	var value;
	var output = '';
	while (++index < length) {
		value = array[index];
		if (value > 0xFFFF) {
			value -= 0x10000;
			output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
			value = 0xDC00 | value & 0x3FF;
		}
		output += stringFromCharCode(value);
	}
	return output;
}

function checkScalarValue(codePoint, strict) {
	if (codePoint >= 0xD800 && codePoint <= 0xDFFF) {
		if (strict) {
			throw Error(
				'Lone surrogate U+' + codePoint.toString(16).toUpperCase() +
				' is not a scalar value'
			);
		}
		return false;
	}
	return true;
}
/*--------------------------------------------------------------------------*/

function createByte(codePoint, shift) {
	return stringFromCharCode(((codePoint >> shift) & 0x3F) | 0x80);
}

function encodeCodePoint(codePoint, strict) {
	if ((codePoint & 0xFFFFFF80) == 0) { // 1-byte sequence
		return stringFromCharCode(codePoint);
	}
	var symbol = '';
	if ((codePoint & 0xFFFFF800) == 0) { // 2-byte sequence
		symbol = stringFromCharCode(((codePoint >> 6) & 0x1F) | 0xC0);
	}
	else if ((codePoint & 0xFFFF0000) == 0) { // 3-byte sequence
		if (!checkScalarValue(codePoint, strict)) {
			codePoint = 0xFFFD;
		}
		symbol = stringFromCharCode(((codePoint >> 12) & 0x0F) | 0xE0);
		symbol += createByte(codePoint, 6);
	}
	else if ((codePoint & 0xFFE00000) == 0) { // 4-byte sequence
		symbol = stringFromCharCode(((codePoint >> 18) & 0x07) | 0xF0);
		symbol += createByte(codePoint, 12);
		symbol += createByte(codePoint, 6);
	}
	symbol += stringFromCharCode((codePoint & 0x3F) | 0x80);
	return symbol;
}

function utf8encode(string, opts) {
	opts = opts || {};
	var strict = false !== opts.strict;

	var codePoints = ucs2decode(string);
	var length = codePoints.length;
	var index = -1;
	var codePoint;
	var byteString = '';
	while (++index < length) {
		codePoint = codePoints[index];
		byteString += encodeCodePoint(codePoint, strict);
	}
	return byteString;
}

/*--------------------------------------------------------------------------*/

function readContinuationByte() {
	if (byteIndex >= byteCount) {
		throw Error('Invalid byte index');
	}

	var continuationByte = byteArray[byteIndex] & 0xFF;
	byteIndex++;

	if ((continuationByte & 0xC0) == 0x80) {
		return continuationByte & 0x3F;
	}

	// If we end up here, it’s not a continuation byte
	throw Error('Invalid continuation byte');
}

function decodeSymbol(strict) {
	var byte1;
	var byte2;
	var byte3;
	var byte4;
	var codePoint;

	if (byteIndex > byteCount) {
		throw Error('Invalid byte index');
	}

	if (byteIndex == byteCount) {
		return false;
	}

	// Read first byte
	byte1 = byteArray[byteIndex] & 0xFF;
	byteIndex++;

	// 1-byte sequence (no continuation bytes)
	if ((byte1 & 0x80) == 0) {
		return byte1;
	}

	// 2-byte sequence
	if ((byte1 & 0xE0) == 0xC0) {
		byte2 = readContinuationByte();
		codePoint = ((byte1 & 0x1F) << 6) | byte2;
		if (codePoint >= 0x80) {
			return codePoint;
		} else {
			throw Error('Invalid continuation byte');
		}
	}

	// 3-byte sequence (may include unpaired surrogates)
	if ((byte1 & 0xF0) == 0xE0) {
		byte2 = readContinuationByte();
		byte3 = readContinuationByte();
		codePoint = ((byte1 & 0x0F) << 12) | (byte2 << 6) | byte3;
		if (codePoint >= 0x0800) {
			return checkScalarValue(codePoint, strict) ? codePoint : 0xFFFD;
		} else {
			throw Error('Invalid continuation byte');
		}
	}

	// 4-byte sequence
	if ((byte1 & 0xF8) == 0xF0) {
		byte2 = readContinuationByte();
		byte3 = readContinuationByte();
		byte4 = readContinuationByte();
		codePoint = ((byte1 & 0x07) << 0x12) | (byte2 << 0x0C) |
			(byte3 << 0x06) | byte4;
		if (codePoint >= 0x010000 && codePoint <= 0x10FFFF) {
			return codePoint;
		}
	}

	throw Error('Invalid UTF-8 detected');
}

var byteArray;
var byteCount;
var byteIndex;
function utf8decode(byteString, opts) {
	opts = opts || {};
	var strict = false !== opts.strict;

	byteArray = ucs2decode(byteString);
	byteCount = byteArray.length;
	byteIndex = 0;
	var codePoints = [];
	var tmp;
	while ((tmp = decodeSymbol(strict)) !== false) {
		codePoints.push(tmp);
	}
	return ucs2encode(codePoints);
}

module.exports = {
	version: '2.1.2',
	encode: utf8encode,
	decode: utf8decode
};

},{}],26:[function(require,module,exports){
(function (Buffer){
/* global Blob File */

/*
 * Module requirements.
 */

var isArray = require('isarray');

var toString = Object.prototype.toString;
var withNativeBlob = typeof Blob === 'function' ||
                        typeof Blob !== 'undefined' && toString.call(Blob) === '[object BlobConstructor]';
var withNativeFile = typeof File === 'function' ||
                        typeof File !== 'undefined' && toString.call(File) === '[object FileConstructor]';

/**
 * Module exports.
 */

module.exports = hasBinary;

/**
 * Checks for binary data.
 *
 * Supports Buffer, ArrayBuffer, Blob and File.
 *
 * @param {Object} anything
 * @api public
 */

function hasBinary (obj) {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  if (isArray(obj)) {
    for (var i = 0, l = obj.length; i < l; i++) {
      if (hasBinary(obj[i])) {
        return true;
      }
    }
    return false;
  }

  if ((typeof Buffer === 'function' && Buffer.isBuffer && Buffer.isBuffer(obj)) ||
    (typeof ArrayBuffer === 'function' && obj instanceof ArrayBuffer) ||
    (withNativeBlob && obj instanceof Blob) ||
    (withNativeFile && obj instanceof File)
  ) {
    return true;
  }

  // see: https://github.com/Automattic/has-binary/pull/4
  if (obj.toJSON && typeof obj.toJSON === 'function' && arguments.length === 1) {
    return hasBinary(obj.toJSON(), true);
  }

  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && hasBinary(obj[key])) {
      return true;
    }
  }

  return false;
}

}).call(this,require("buffer").Buffer)
},{"buffer":8,"isarray":30}],27:[function(require,module,exports){

/**
 * Module exports.
 *
 * Logic borrowed from Modernizr:
 *
 *   - https://github.com/Modernizr/Modernizr/blob/master/feature-detects/cors.js
 */

try {
  module.exports = typeof XMLHttpRequest !== 'undefined' &&
    'withCredentials' in new XMLHttpRequest();
} catch (err) {
  // if XMLHttp support is disabled in IE then it will throw
  // when trying to create
  module.exports = false;
}

},{}],28:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],29:[function(require,module,exports){

var indexOf = [].indexOf;

module.exports = function(arr, obj){
  if (indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
},{}],30:[function(require,module,exports){
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}],31:[function(require,module,exports){
/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} [options]
 * @throws {Error} throw an error if val is not a non-empty string or a number
 * @return {String|Number}
 * @api public
 */

module.exports = function(val, options) {
  options = options || {};
  var type = typeof val;
  if (type === 'string' && val.length > 0) {
    return parse(val);
  } else if (type === 'number' && isNaN(val) === false) {
    return options.long ? fmtLong(val) : fmtShort(val);
  }
  throw new Error(
    'val is not a non-empty string or a valid number. val=' +
      JSON.stringify(val)
  );
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = String(str);
  if (str.length > 100) {
    return;
  }
  var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(
    str
  );
  if (!match) {
    return;
  }
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
    default:
      return undefined;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtShort(ms) {
  if (ms >= d) {
    return Math.round(ms / d) + 'd';
  }
  if (ms >= h) {
    return Math.round(ms / h) + 'h';
  }
  if (ms >= m) {
    return Math.round(ms / m) + 'm';
  }
  if (ms >= s) {
    return Math.round(ms / s) + 's';
  }
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtLong(ms) {
  return plural(ms, d, 'day') ||
    plural(ms, h, 'hour') ||
    plural(ms, m, 'minute') ||
    plural(ms, s, 'second') ||
    ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
  if (ms < n) {
    return;
  }
  if (ms < n * 1.5) {
    return Math.floor(ms / n) + ' ' + name;
  }
  return Math.ceil(ms / n) + ' ' + name + 's';
}

},{}],32:[function(require,module,exports){
/**
 * Compiles a querystring
 * Returns string representation of the object
 *
 * @param {Object}
 * @api private
 */

exports.encode = function (obj) {
  var str = '';

  for (var i in obj) {
    if (obj.hasOwnProperty(i)) {
      if (str.length) str += '&';
      str += encodeURIComponent(i) + '=' + encodeURIComponent(obj[i]);
    }
  }

  return str;
};

/**
 * Parses a simple querystring into an object
 *
 * @param {String} qs
 * @api private
 */

exports.decode = function(qs){
  var qry = {};
  var pairs = qs.split('&');
  for (var i = 0, l = pairs.length; i < l; i++) {
    var pair = pairs[i].split('=');
    qry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
  }
  return qry;
};

},{}],33:[function(require,module,exports){
/**
 * Parses an URI
 *
 * @author Steven Levithan <stevenlevithan.com> (MIT license)
 * @api private
 */

var re = /^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;

var parts = [
    'source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'
];

module.exports = function parseuri(str) {
    var src = str,
        b = str.indexOf('['),
        e = str.indexOf(']');

    if (b != -1 && e != -1) {
        str = str.substring(0, b) + str.substring(b, e).replace(/:/g, ';') + str.substring(e, str.length);
    }

    var m = re.exec(str || ''),
        uri = {},
        i = 14;

    while (i--) {
        uri[parts[i]] = m[i] || '';
    }

    if (b != -1 && e != -1) {
        uri.source = src;
        uri.host = uri.host.substring(1, uri.host.length - 1).replace(/;/g, ':');
        uri.authority = uri.authority.replace('[', '').replace(']', '').replace(/;/g, ':');
        uri.ipv6uri = true;
    }

    return uri;
};

},{}],34:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],35:[function(require,module,exports){

/**
 * Module dependencies.
 */

var url = require('./url');
var parser = require('socket.io-parser');
var Manager = require('./manager');
var debug = require('debug')('socket.io-client');

/**
 * Module exports.
 */

module.exports = exports = lookup;

/**
 * Managers cache.
 */

var cache = exports.managers = {};

/**
 * Looks up an existing `Manager` for multiplexing.
 * If the user summons:
 *
 *   `io('http://localhost/a');`
 *   `io('http://localhost/b');`
 *
 * We reuse the existing instance based on same scheme/port/host,
 * and we initialize sockets for each namespace.
 *
 * @api public
 */

function lookup (uri, opts) {
  if (typeof uri === 'object') {
    opts = uri;
    uri = undefined;
  }

  opts = opts || {};

  var parsed = url(uri);
  var source = parsed.source;
  var id = parsed.id;
  var path = parsed.path;
  var sameNamespace = cache[id] && path in cache[id].nsps;
  var newConnection = opts.forceNew || opts['force new connection'] ||
                      false === opts.multiplex || sameNamespace;

  var io;

  if (newConnection) {
    debug('ignoring socket cache for %s', source);
    io = Manager(source, opts);
  } else {
    if (!cache[id]) {
      debug('new io instance for %s', source);
      cache[id] = Manager(source, opts);
    }
    io = cache[id];
  }
  if (parsed.query && !opts.query) {
    opts.query = parsed.query;
  }
  return io.socket(parsed.path, opts);
}

/**
 * Protocol version.
 *
 * @api public
 */

exports.protocol = parser.protocol;

/**
 * `connect`.
 *
 * @param {String} uri
 * @api public
 */

exports.connect = lookup;

/**
 * Expose constructors for standalone build.
 *
 * @api public
 */

exports.Manager = require('./manager');
exports.Socket = require('./socket');

},{"./manager":36,"./socket":38,"./url":39,"debug":40,"socket.io-parser":43}],36:[function(require,module,exports){

/**
 * Module dependencies.
 */

var eio = require('engine.io-client');
var Socket = require('./socket');
var Emitter = require('component-emitter');
var parser = require('socket.io-parser');
var on = require('./on');
var bind = require('component-bind');
var debug = require('debug')('socket.io-client:manager');
var indexOf = require('indexof');
var Backoff = require('backo2');

/**
 * IE6+ hasOwnProperty
 */

var has = Object.prototype.hasOwnProperty;

/**
 * Module exports
 */

module.exports = Manager;

/**
 * `Manager` constructor.
 *
 * @param {String} engine instance or engine uri/opts
 * @param {Object} options
 * @api public
 */

function Manager (uri, opts) {
  if (!(this instanceof Manager)) return new Manager(uri, opts);
  if (uri && ('object' === typeof uri)) {
    opts = uri;
    uri = undefined;
  }
  opts = opts || {};

  opts.path = opts.path || '/socket.io';
  this.nsps = {};
  this.subs = [];
  this.opts = opts;
  this.reconnection(opts.reconnection !== false);
  this.reconnectionAttempts(opts.reconnectionAttempts || Infinity);
  this.reconnectionDelay(opts.reconnectionDelay || 1000);
  this.reconnectionDelayMax(opts.reconnectionDelayMax || 5000);
  this.randomizationFactor(opts.randomizationFactor || 0.5);
  this.backoff = new Backoff({
    min: this.reconnectionDelay(),
    max: this.reconnectionDelayMax(),
    jitter: this.randomizationFactor()
  });
  this.timeout(null == opts.timeout ? 20000 : opts.timeout);
  this.readyState = 'closed';
  this.uri = uri;
  this.connecting = [];
  this.lastPing = null;
  this.encoding = false;
  this.packetBuffer = [];
  var _parser = opts.parser || parser;
  this.encoder = new _parser.Encoder();
  this.decoder = new _parser.Decoder();
  this.autoConnect = opts.autoConnect !== false;
  if (this.autoConnect) this.open();
}

/**
 * Propagate given event to sockets and emit on `this`
 *
 * @api private
 */

Manager.prototype.emitAll = function () {
  this.emit.apply(this, arguments);
  for (var nsp in this.nsps) {
    if (has.call(this.nsps, nsp)) {
      this.nsps[nsp].emit.apply(this.nsps[nsp], arguments);
    }
  }
};

/**
 * Update `socket.id` of all sockets
 *
 * @api private
 */

Manager.prototype.updateSocketIds = function () {
  for (var nsp in this.nsps) {
    if (has.call(this.nsps, nsp)) {
      this.nsps[nsp].id = this.generateId(nsp);
    }
  }
};

/**
 * generate `socket.id` for the given `nsp`
 *
 * @param {String} nsp
 * @return {String}
 * @api private
 */

Manager.prototype.generateId = function (nsp) {
  return (nsp === '/' ? '' : (nsp + '#')) + this.engine.id;
};

/**
 * Mix in `Emitter`.
 */

Emitter(Manager.prototype);

/**
 * Sets the `reconnection` config.
 *
 * @param {Boolean} true/false if it should automatically reconnect
 * @return {Manager} self or value
 * @api public
 */

Manager.prototype.reconnection = function (v) {
  if (!arguments.length) return this._reconnection;
  this._reconnection = !!v;
  return this;
};

/**
 * Sets the reconnection attempts config.
 *
 * @param {Number} max reconnection attempts before giving up
 * @return {Manager} self or value
 * @api public
 */

Manager.prototype.reconnectionAttempts = function (v) {
  if (!arguments.length) return this._reconnectionAttempts;
  this._reconnectionAttempts = v;
  return this;
};

/**
 * Sets the delay between reconnections.
 *
 * @param {Number} delay
 * @return {Manager} self or value
 * @api public
 */

Manager.prototype.reconnectionDelay = function (v) {
  if (!arguments.length) return this._reconnectionDelay;
  this._reconnectionDelay = v;
  this.backoff && this.backoff.setMin(v);
  return this;
};

Manager.prototype.randomizationFactor = function (v) {
  if (!arguments.length) return this._randomizationFactor;
  this._randomizationFactor = v;
  this.backoff && this.backoff.setJitter(v);
  return this;
};

/**
 * Sets the maximum delay between reconnections.
 *
 * @param {Number} delay
 * @return {Manager} self or value
 * @api public
 */

Manager.prototype.reconnectionDelayMax = function (v) {
  if (!arguments.length) return this._reconnectionDelayMax;
  this._reconnectionDelayMax = v;
  this.backoff && this.backoff.setMax(v);
  return this;
};

/**
 * Sets the connection timeout. `false` to disable
 *
 * @return {Manager} self or value
 * @api public
 */

Manager.prototype.timeout = function (v) {
  if (!arguments.length) return this._timeout;
  this._timeout = v;
  return this;
};

/**
 * Starts trying to reconnect if reconnection is enabled and we have not
 * started reconnecting yet
 *
 * @api private
 */

Manager.prototype.maybeReconnectOnOpen = function () {
  // Only try to reconnect if it's the first time we're connecting
  if (!this.reconnecting && this._reconnection && this.backoff.attempts === 0) {
    // keeps reconnection from firing twice for the same reconnection loop
    this.reconnect();
  }
};

/**
 * Sets the current transport `socket`.
 *
 * @param {Function} optional, callback
 * @return {Manager} self
 * @api public
 */

Manager.prototype.open =
Manager.prototype.connect = function (fn, opts) {
  debug('readyState %s', this.readyState);
  if (~this.readyState.indexOf('open')) return this;

  debug('opening %s', this.uri);
  this.engine = eio(this.uri, this.opts);
  var socket = this.engine;
  var self = this;
  this.readyState = 'opening';
  this.skipReconnect = false;

  // emit `open`
  var openSub = on(socket, 'open', function () {
    self.onopen();
    fn && fn();
  });

  // emit `connect_error`
  var errorSub = on(socket, 'error', function (data) {
    debug('connect_error');
    self.cleanup();
    self.readyState = 'closed';
    self.emitAll('connect_error', data);
    if (fn) {
      var err = new Error('Connection error');
      err.data = data;
      fn(err);
    } else {
      // Only do this if there is no fn to handle the error
      self.maybeReconnectOnOpen();
    }
  });

  // emit `connect_timeout`
  if (false !== this._timeout) {
    var timeout = this._timeout;
    debug('connect attempt will timeout after %d', timeout);

    // set timer
    var timer = setTimeout(function () {
      debug('connect attempt timed out after %d', timeout);
      openSub.destroy();
      socket.close();
      socket.emit('error', 'timeout');
      self.emitAll('connect_timeout', timeout);
    }, timeout);

    this.subs.push({
      destroy: function () {
        clearTimeout(timer);
      }
    });
  }

  this.subs.push(openSub);
  this.subs.push(errorSub);

  return this;
};

/**
 * Called upon transport open.
 *
 * @api private
 */

Manager.prototype.onopen = function () {
  debug('open');

  // clear old subs
  this.cleanup();

  // mark as open
  this.readyState = 'open';
  this.emit('open');

  // add new subs
  var socket = this.engine;
  this.subs.push(on(socket, 'data', bind(this, 'ondata')));
  this.subs.push(on(socket, 'ping', bind(this, 'onping')));
  this.subs.push(on(socket, 'pong', bind(this, 'onpong')));
  this.subs.push(on(socket, 'error', bind(this, 'onerror')));
  this.subs.push(on(socket, 'close', bind(this, 'onclose')));
  this.subs.push(on(this.decoder, 'decoded', bind(this, 'ondecoded')));
};

/**
 * Called upon a ping.
 *
 * @api private
 */

Manager.prototype.onping = function () {
  this.lastPing = new Date();
  this.emitAll('ping');
};

/**
 * Called upon a packet.
 *
 * @api private
 */

Manager.prototype.onpong = function () {
  this.emitAll('pong', new Date() - this.lastPing);
};

/**
 * Called with data.
 *
 * @api private
 */

Manager.prototype.ondata = function (data) {
  this.decoder.add(data);
};

/**
 * Called when parser fully decodes a packet.
 *
 * @api private
 */

Manager.prototype.ondecoded = function (packet) {
  this.emit('packet', packet);
};

/**
 * Called upon socket error.
 *
 * @api private
 */

Manager.prototype.onerror = function (err) {
  debug('error', err);
  this.emitAll('error', err);
};

/**
 * Creates a new socket for the given `nsp`.
 *
 * @return {Socket}
 * @api public
 */

Manager.prototype.socket = function (nsp, opts) {
  var socket = this.nsps[nsp];
  if (!socket) {
    socket = new Socket(this, nsp, opts);
    this.nsps[nsp] = socket;
    var self = this;
    socket.on('connecting', onConnecting);
    socket.on('connect', function () {
      socket.id = self.generateId(nsp);
    });

    if (this.autoConnect) {
      // manually call here since connecting event is fired before listening
      onConnecting();
    }
  }

  function onConnecting () {
    if (!~indexOf(self.connecting, socket)) {
      self.connecting.push(socket);
    }
  }

  return socket;
};

/**
 * Called upon a socket close.
 *
 * @param {Socket} socket
 */

Manager.prototype.destroy = function (socket) {
  var index = indexOf(this.connecting, socket);
  if (~index) this.connecting.splice(index, 1);
  if (this.connecting.length) return;

  this.close();
};

/**
 * Writes a packet.
 *
 * @param {Object} packet
 * @api private
 */

Manager.prototype.packet = function (packet) {
  debug('writing packet %j', packet);
  var self = this;
  if (packet.query && packet.type === 0) packet.nsp += '?' + packet.query;

  if (!self.encoding) {
    // encode, then write to engine with result
    self.encoding = true;
    this.encoder.encode(packet, function (encodedPackets) {
      for (var i = 0; i < encodedPackets.length; i++) {
        self.engine.write(encodedPackets[i], packet.options);
      }
      self.encoding = false;
      self.processPacketQueue();
    });
  } else { // add packet to the queue
    self.packetBuffer.push(packet);
  }
};

/**
 * If packet buffer is non-empty, begins encoding the
 * next packet in line.
 *
 * @api private
 */

Manager.prototype.processPacketQueue = function () {
  if (this.packetBuffer.length > 0 && !this.encoding) {
    var pack = this.packetBuffer.shift();
    this.packet(pack);
  }
};

/**
 * Clean up transport subscriptions and packet buffer.
 *
 * @api private
 */

Manager.prototype.cleanup = function () {
  debug('cleanup');

  var subsLength = this.subs.length;
  for (var i = 0; i < subsLength; i++) {
    var sub = this.subs.shift();
    sub.destroy();
  }

  this.packetBuffer = [];
  this.encoding = false;
  this.lastPing = null;

  this.decoder.destroy();
};

/**
 * Close the current socket.
 *
 * @api private
 */

Manager.prototype.close =
Manager.prototype.disconnect = function () {
  debug('disconnect');
  this.skipReconnect = true;
  this.reconnecting = false;
  if ('opening' === this.readyState) {
    // `onclose` will not fire because
    // an open event never happened
    this.cleanup();
  }
  this.backoff.reset();
  this.readyState = 'closed';
  if (this.engine) this.engine.close();
};

/**
 * Called upon engine close.
 *
 * @api private
 */

Manager.prototype.onclose = function (reason) {
  debug('onclose');

  this.cleanup();
  this.backoff.reset();
  this.readyState = 'closed';
  this.emit('close', reason);

  if (this._reconnection && !this.skipReconnect) {
    this.reconnect();
  }
};

/**
 * Attempt a reconnection.
 *
 * @api private
 */

Manager.prototype.reconnect = function () {
  if (this.reconnecting || this.skipReconnect) return this;

  var self = this;

  if (this.backoff.attempts >= this._reconnectionAttempts) {
    debug('reconnect failed');
    this.backoff.reset();
    this.emitAll('reconnect_failed');
    this.reconnecting = false;
  } else {
    var delay = this.backoff.duration();
    debug('will wait %dms before reconnect attempt', delay);

    this.reconnecting = true;
    var timer = setTimeout(function () {
      if (self.skipReconnect) return;

      debug('attempting reconnect');
      self.emitAll('reconnect_attempt', self.backoff.attempts);
      self.emitAll('reconnecting', self.backoff.attempts);

      // check again for the case socket closed in above events
      if (self.skipReconnect) return;

      self.open(function (err) {
        if (err) {
          debug('reconnect attempt error');
          self.reconnecting = false;
          self.reconnect();
          self.emitAll('reconnect_error', err.data);
        } else {
          debug('reconnect success');
          self.onreconnect();
        }
      });
    }, delay);

    this.subs.push({
      destroy: function () {
        clearTimeout(timer);
      }
    });
  }
};

/**
 * Called upon successful reconnect.
 *
 * @api private
 */

Manager.prototype.onreconnect = function () {
  var attempt = this.backoff.attempts;
  this.reconnecting = false;
  this.backoff.reset();
  this.updateSocketIds();
  this.emitAll('reconnect', attempt);
};

},{"./on":37,"./socket":38,"backo2":3,"component-bind":9,"component-emitter":10,"debug":40,"engine.io-client":12,"indexof":29,"socket.io-parser":43}],37:[function(require,module,exports){

/**
 * Module exports.
 */

module.exports = on;

/**
 * Helper for subscriptions.
 *
 * @param {Object|EventEmitter} obj with `Emitter` mixin or `EventEmitter`
 * @param {String} event name
 * @param {Function} callback
 * @api public
 */

function on (obj, ev, fn) {
  obj.on(ev, fn);
  return {
    destroy: function () {
      obj.removeListener(ev, fn);
    }
  };
}

},{}],38:[function(require,module,exports){

/**
 * Module dependencies.
 */

var parser = require('socket.io-parser');
var Emitter = require('component-emitter');
var toArray = require('to-array');
var on = require('./on');
var bind = require('component-bind');
var debug = require('debug')('socket.io-client:socket');
var parseqs = require('parseqs');
var hasBin = require('has-binary2');

/**
 * Module exports.
 */

module.exports = exports = Socket;

/**
 * Internal events (blacklisted).
 * These events can't be emitted by the user.
 *
 * @api private
 */

var events = {
  connect: 1,
  connect_error: 1,
  connect_timeout: 1,
  connecting: 1,
  disconnect: 1,
  error: 1,
  reconnect: 1,
  reconnect_attempt: 1,
  reconnect_failed: 1,
  reconnect_error: 1,
  reconnecting: 1,
  ping: 1,
  pong: 1
};

/**
 * Shortcut to `Emitter#emit`.
 */

var emit = Emitter.prototype.emit;

/**
 * `Socket` constructor.
 *
 * @api public
 */

function Socket (io, nsp, opts) {
  this.io = io;
  this.nsp = nsp;
  this.json = this; // compat
  this.ids = 0;
  this.acks = {};
  this.receiveBuffer = [];
  this.sendBuffer = [];
  this.connected = false;
  this.disconnected = true;
  this.flags = {};
  if (opts && opts.query) {
    this.query = opts.query;
  }
  if (this.io.autoConnect) this.open();
}

/**
 * Mix in `Emitter`.
 */

Emitter(Socket.prototype);

/**
 * Subscribe to open, close and packet events
 *
 * @api private
 */

Socket.prototype.subEvents = function () {
  if (this.subs) return;

  var io = this.io;
  this.subs = [
    on(io, 'open', bind(this, 'onopen')),
    on(io, 'packet', bind(this, 'onpacket')),
    on(io, 'close', bind(this, 'onclose'))
  ];
};

/**
 * "Opens" the socket.
 *
 * @api public
 */

Socket.prototype.open =
Socket.prototype.connect = function () {
  if (this.connected) return this;

  this.subEvents();
  this.io.open(); // ensure open
  if ('open' === this.io.readyState) this.onopen();
  this.emit('connecting');
  return this;
};

/**
 * Sends a `message` event.
 *
 * @return {Socket} self
 * @api public
 */

Socket.prototype.send = function () {
  var args = toArray(arguments);
  args.unshift('message');
  this.emit.apply(this, args);
  return this;
};

/**
 * Override `emit`.
 * If the event is in `events`, it's emitted normally.
 *
 * @param {String} event name
 * @return {Socket} self
 * @api public
 */

Socket.prototype.emit = function (ev) {
  if (events.hasOwnProperty(ev)) {
    emit.apply(this, arguments);
    return this;
  }

  var args = toArray(arguments);
  var packet = {
    type: (this.flags.binary !== undefined ? this.flags.binary : hasBin(args)) ? parser.BINARY_EVENT : parser.EVENT,
    data: args
  };

  packet.options = {};
  packet.options.compress = !this.flags || false !== this.flags.compress;

  // event ack callback
  if ('function' === typeof args[args.length - 1]) {
    debug('emitting packet with ack id %d', this.ids);
    this.acks[this.ids] = args.pop();
    packet.id = this.ids++;
  }

  if (this.connected) {
    this.packet(packet);
  } else {
    this.sendBuffer.push(packet);
  }

  this.flags = {};

  return this;
};

/**
 * Sends a packet.
 *
 * @param {Object} packet
 * @api private
 */

Socket.prototype.packet = function (packet) {
  packet.nsp = this.nsp;
  this.io.packet(packet);
};

/**
 * Called upon engine `open`.
 *
 * @api private
 */

Socket.prototype.onopen = function () {
  debug('transport is open - connecting');

  // write connect packet if necessary
  if ('/' !== this.nsp) {
    if (this.query) {
      var query = typeof this.query === 'object' ? parseqs.encode(this.query) : this.query;
      debug('sending connect packet with query %s', query);
      this.packet({type: parser.CONNECT, query: query});
    } else {
      this.packet({type: parser.CONNECT});
    }
  }
};

/**
 * Called upon engine `close`.
 *
 * @param {String} reason
 * @api private
 */

Socket.prototype.onclose = function (reason) {
  debug('close (%s)', reason);
  this.connected = false;
  this.disconnected = true;
  delete this.id;
  this.emit('disconnect', reason);
};

/**
 * Called with socket packet.
 *
 * @param {Object} packet
 * @api private
 */

Socket.prototype.onpacket = function (packet) {
  var sameNamespace = packet.nsp === this.nsp;
  var rootNamespaceError = packet.type === parser.ERROR && packet.nsp === '/';

  if (!sameNamespace && !rootNamespaceError) return;

  switch (packet.type) {
    case parser.CONNECT:
      this.onconnect();
      break;

    case parser.EVENT:
      this.onevent(packet);
      break;

    case parser.BINARY_EVENT:
      this.onevent(packet);
      break;

    case parser.ACK:
      this.onack(packet);
      break;

    case parser.BINARY_ACK:
      this.onack(packet);
      break;

    case parser.DISCONNECT:
      this.ondisconnect();
      break;

    case parser.ERROR:
      this.emit('error', packet.data);
      break;
  }
};

/**
 * Called upon a server event.
 *
 * @param {Object} packet
 * @api private
 */

Socket.prototype.onevent = function (packet) {
  var args = packet.data || [];
  debug('emitting event %j', args);

  if (null != packet.id) {
    debug('attaching ack callback to event');
    args.push(this.ack(packet.id));
  }

  if (this.connected) {
    emit.apply(this, args);
  } else {
    this.receiveBuffer.push(args);
  }
};

/**
 * Produces an ack callback to emit with an event.
 *
 * @api private
 */

Socket.prototype.ack = function (id) {
  var self = this;
  var sent = false;
  return function () {
    // prevent double callbacks
    if (sent) return;
    sent = true;
    var args = toArray(arguments);
    debug('sending ack %j', args);

    self.packet({
      type: hasBin(args) ? parser.BINARY_ACK : parser.ACK,
      id: id,
      data: args
    });
  };
};

/**
 * Called upon a server acknowlegement.
 *
 * @param {Object} packet
 * @api private
 */

Socket.prototype.onack = function (packet) {
  var ack = this.acks[packet.id];
  if ('function' === typeof ack) {
    debug('calling ack %s with %j', packet.id, packet.data);
    ack.apply(this, packet.data);
    delete this.acks[packet.id];
  } else {
    debug('bad ack %s', packet.id);
  }
};

/**
 * Called upon server connect.
 *
 * @api private
 */

Socket.prototype.onconnect = function () {
  this.connected = true;
  this.disconnected = false;
  this.emit('connect');
  this.emitBuffered();
};

/**
 * Emit buffered events (received and emitted).
 *
 * @api private
 */

Socket.prototype.emitBuffered = function () {
  var i;
  for (i = 0; i < this.receiveBuffer.length; i++) {
    emit.apply(this, this.receiveBuffer[i]);
  }
  this.receiveBuffer = [];

  for (i = 0; i < this.sendBuffer.length; i++) {
    this.packet(this.sendBuffer[i]);
  }
  this.sendBuffer = [];
};

/**
 * Called upon server disconnect.
 *
 * @api private
 */

Socket.prototype.ondisconnect = function () {
  debug('server disconnect (%s)', this.nsp);
  this.destroy();
  this.onclose('io server disconnect');
};

/**
 * Called upon forced client/server side disconnections,
 * this method ensures the manager stops tracking us and
 * that reconnections don't get triggered for this.
 *
 * @api private.
 */

Socket.prototype.destroy = function () {
  if (this.subs) {
    // clean subscriptions to avoid reconnections
    for (var i = 0; i < this.subs.length; i++) {
      this.subs[i].destroy();
    }
    this.subs = null;
  }

  this.io.destroy(this);
};

/**
 * Disconnects the socket manually.
 *
 * @return {Socket} self
 * @api public
 */

Socket.prototype.close =
Socket.prototype.disconnect = function () {
  if (this.connected) {
    debug('performing disconnect (%s)', this.nsp);
    this.packet({ type: parser.DISCONNECT });
  }

  // remove socket from pool
  this.destroy();

  if (this.connected) {
    // fire events
    this.onclose('io client disconnect');
  }
  return this;
};

/**
 * Sets the compress flag.
 *
 * @param {Boolean} if `true`, compresses the sending data
 * @return {Socket} self
 * @api public
 */

Socket.prototype.compress = function (compress) {
  this.flags.compress = compress;
  return this;
};

/**
 * Sets the binary flag
 *
 * @param {Boolean} whether the emitted data contains binary
 * @return {Socket} self
 * @api public
 */

Socket.prototype.binary = function (binary) {
  this.flags.binary = binary;
  return this;
};

},{"./on":37,"component-bind":9,"component-emitter":10,"debug":40,"has-binary2":26,"parseqs":32,"socket.io-parser":43,"to-array":47}],39:[function(require,module,exports){

/**
 * Module dependencies.
 */

var parseuri = require('parseuri');
var debug = require('debug')('socket.io-client:url');

/**
 * Module exports.
 */

module.exports = url;

/**
 * URL parser.
 *
 * @param {String} url
 * @param {Object} An object meant to mimic window.location.
 *                 Defaults to window.location.
 * @api public
 */

function url (uri, loc) {
  var obj = uri;

  // default to window.location
  loc = loc || (typeof location !== 'undefined' && location);
  if (null == uri) uri = loc.protocol + '//' + loc.host;

  // relative path support
  if ('string' === typeof uri) {
    if ('/' === uri.charAt(0)) {
      if ('/' === uri.charAt(1)) {
        uri = loc.protocol + uri;
      } else {
        uri = loc.host + uri;
      }
    }

    if (!/^(https?|wss?):\/\//.test(uri)) {
      debug('protocol-less url %s', uri);
      if ('undefined' !== typeof loc) {
        uri = loc.protocol + '//' + uri;
      } else {
        uri = 'https://' + uri;
      }
    }

    // parse
    debug('parse %s', uri);
    obj = parseuri(uri);
  }

  // make sure we treat `localhost:80` and `localhost` equally
  if (!obj.port) {
    if (/^(http|ws)$/.test(obj.protocol)) {
      obj.port = '80';
    } else if (/^(http|ws)s$/.test(obj.protocol)) {
      obj.port = '443';
    }
  }

  obj.path = obj.path || '/';

  var ipv6 = obj.host.indexOf(':') !== -1;
  var host = ipv6 ? '[' + obj.host + ']' : obj.host;

  // define unique id
  obj.id = obj.protocol + '://' + host + ':' + obj.port;
  // define href
  obj.href = obj.protocol + '://' + host + (loc && loc.port === obj.port ? '' : (':' + obj.port));

  return obj;
}

},{"debug":40,"parseuri":33}],40:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"./debug":41,"_process":34,"dup":21}],41:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22,"ms":31}],42:[function(require,module,exports){
/*global Blob,File*/

/**
 * Module requirements
 */

var isArray = require('isarray');
var isBuf = require('./is-buffer');
var toString = Object.prototype.toString;
var withNativeBlob = typeof Blob === 'function' || (typeof Blob !== 'undefined' && toString.call(Blob) === '[object BlobConstructor]');
var withNativeFile = typeof File === 'function' || (typeof File !== 'undefined' && toString.call(File) === '[object FileConstructor]');

/**
 * Replaces every Buffer | ArrayBuffer in packet with a numbered placeholder.
 * Anything with blobs or files should be fed through removeBlobs before coming
 * here.
 *
 * @param {Object} packet - socket.io event packet
 * @return {Object} with deconstructed packet and list of buffers
 * @api public
 */

exports.deconstructPacket = function(packet) {
  var buffers = [];
  var packetData = packet.data;
  var pack = packet;
  pack.data = _deconstructPacket(packetData, buffers);
  pack.attachments = buffers.length; // number of binary 'attachments'
  return {packet: pack, buffers: buffers};
};

function _deconstructPacket(data, buffers) {
  if (!data) return data;

  if (isBuf(data)) {
    var placeholder = { _placeholder: true, num: buffers.length };
    buffers.push(data);
    return placeholder;
  } else if (isArray(data)) {
    var newData = new Array(data.length);
    for (var i = 0; i < data.length; i++) {
      newData[i] = _deconstructPacket(data[i], buffers);
    }
    return newData;
  } else if (typeof data === 'object' && !(data instanceof Date)) {
    var newData = {};
    for (var key in data) {
      newData[key] = _deconstructPacket(data[key], buffers);
    }
    return newData;
  }
  return data;
}

/**
 * Reconstructs a binary packet from its placeholder packet and buffers
 *
 * @param {Object} packet - event packet with placeholders
 * @param {Array} buffers - binary buffers to put in placeholder positions
 * @return {Object} reconstructed packet
 * @api public
 */

exports.reconstructPacket = function(packet, buffers) {
  packet.data = _reconstructPacket(packet.data, buffers);
  packet.attachments = undefined; // no longer useful
  return packet;
};

function _reconstructPacket(data, buffers) {
  if (!data) return data;

  if (data && data._placeholder) {
    return buffers[data.num]; // appropriate buffer (should be natural order anyway)
  } else if (isArray(data)) {
    for (var i = 0; i < data.length; i++) {
      data[i] = _reconstructPacket(data[i], buffers);
    }
  } else if (typeof data === 'object') {
    for (var key in data) {
      data[key] = _reconstructPacket(data[key], buffers);
    }
  }

  return data;
}

/**
 * Asynchronously removes Blobs or Files from data via
 * FileReader's readAsArrayBuffer method. Used before encoding
 * data as msgpack. Calls callback with the blobless data.
 *
 * @param {Object} data
 * @param {Function} callback
 * @api private
 */

exports.removeBlobs = function(data, callback) {
  function _removeBlobs(obj, curKey, containingObject) {
    if (!obj) return obj;

    // convert any blob
    if ((withNativeBlob && obj instanceof Blob) ||
        (withNativeFile && obj instanceof File)) {
      pendingBlobs++;

      // async filereader
      var fileReader = new FileReader();
      fileReader.onload = function() { // this.result == arraybuffer
        if (containingObject) {
          containingObject[curKey] = this.result;
        }
        else {
          bloblessData = this.result;
        }

        // if nothing pending its callback time
        if(! --pendingBlobs) {
          callback(bloblessData);
        }
      };

      fileReader.readAsArrayBuffer(obj); // blob -> arraybuffer
    } else if (isArray(obj)) { // handle array
      for (var i = 0; i < obj.length; i++) {
        _removeBlobs(obj[i], i, obj);
      }
    } else if (typeof obj === 'object' && !isBuf(obj)) { // and object
      for (var key in obj) {
        _removeBlobs(obj[key], key, obj);
      }
    }
  }

  var pendingBlobs = 0;
  var bloblessData = data;
  _removeBlobs(bloblessData);
  if (!pendingBlobs) {
    callback(bloblessData);
  }
};

},{"./is-buffer":44,"isarray":30}],43:[function(require,module,exports){

/**
 * Module dependencies.
 */

var debug = require('debug')('socket.io-parser');
var Emitter = require('component-emitter');
var binary = require('./binary');
var isArray = require('isarray');
var isBuf = require('./is-buffer');

/**
 * Protocol version.
 *
 * @api public
 */

exports.protocol = 4;

/**
 * Packet types.
 *
 * @api public
 */

exports.types = [
  'CONNECT',
  'DISCONNECT',
  'EVENT',
  'ACK',
  'ERROR',
  'BINARY_EVENT',
  'BINARY_ACK'
];

/**
 * Packet type `connect`.
 *
 * @api public
 */

exports.CONNECT = 0;

/**
 * Packet type `disconnect`.
 *
 * @api public
 */

exports.DISCONNECT = 1;

/**
 * Packet type `event`.
 *
 * @api public
 */

exports.EVENT = 2;

/**
 * Packet type `ack`.
 *
 * @api public
 */

exports.ACK = 3;

/**
 * Packet type `error`.
 *
 * @api public
 */

exports.ERROR = 4;

/**
 * Packet type 'binary event'
 *
 * @api public
 */

exports.BINARY_EVENT = 5;

/**
 * Packet type `binary ack`. For acks with binary arguments.
 *
 * @api public
 */

exports.BINARY_ACK = 6;

/**
 * Encoder constructor.
 *
 * @api public
 */

exports.Encoder = Encoder;

/**
 * Decoder constructor.
 *
 * @api public
 */

exports.Decoder = Decoder;

/**
 * A socket.io Encoder instance
 *
 * @api public
 */

function Encoder() {}

var ERROR_PACKET = exports.ERROR + '"encode error"';

/**
 * Encode a packet as a single string if non-binary, or as a
 * buffer sequence, depending on packet type.
 *
 * @param {Object} obj - packet object
 * @param {Function} callback - function to handle encodings (likely engine.write)
 * @return Calls callback with Array of encodings
 * @api public
 */

Encoder.prototype.encode = function(obj, callback){
  debug('encoding packet %j', obj);

  if (exports.BINARY_EVENT === obj.type || exports.BINARY_ACK === obj.type) {
    encodeAsBinary(obj, callback);
  } else {
    var encoding = encodeAsString(obj);
    callback([encoding]);
  }
};

/**
 * Encode packet as string.
 *
 * @param {Object} packet
 * @return {String} encoded
 * @api private
 */

function encodeAsString(obj) {

  // first is type
  var str = '' + obj.type;

  // attachments if we have them
  if (exports.BINARY_EVENT === obj.type || exports.BINARY_ACK === obj.type) {
    str += obj.attachments + '-';
  }

  // if we have a namespace other than `/`
  // we append it followed by a comma `,`
  if (obj.nsp && '/' !== obj.nsp) {
    str += obj.nsp + ',';
  }

  // immediately followed by the id
  if (null != obj.id) {
    str += obj.id;
  }

  // json data
  if (null != obj.data) {
    var payload = tryStringify(obj.data);
    if (payload !== false) {
      str += payload;
    } else {
      return ERROR_PACKET;
    }
  }

  debug('encoded %j as %s', obj, str);
  return str;
}

function tryStringify(str) {
  try {
    return JSON.stringify(str);
  } catch(e){
    return false;
  }
}

/**
 * Encode packet as 'buffer sequence' by removing blobs, and
 * deconstructing packet into object with placeholders and
 * a list of buffers.
 *
 * @param {Object} packet
 * @return {Buffer} encoded
 * @api private
 */

function encodeAsBinary(obj, callback) {

  function writeEncoding(bloblessData) {
    var deconstruction = binary.deconstructPacket(bloblessData);
    var pack = encodeAsString(deconstruction.packet);
    var buffers = deconstruction.buffers;

    buffers.unshift(pack); // add packet info to beginning of data list
    callback(buffers); // write all the buffers
  }

  binary.removeBlobs(obj, writeEncoding);
}

/**
 * A socket.io Decoder instance
 *
 * @return {Object} decoder
 * @api public
 */

function Decoder() {
  this.reconstructor = null;
}

/**
 * Mix in `Emitter` with Decoder.
 */

Emitter(Decoder.prototype);

/**
 * Decodes an encoded packet string into packet JSON.
 *
 * @param {String} obj - encoded packet
 * @return {Object} packet
 * @api public
 */

Decoder.prototype.add = function(obj) {
  var packet;
  if (typeof obj === 'string') {
    packet = decodeString(obj);
    if (exports.BINARY_EVENT === packet.type || exports.BINARY_ACK === packet.type) { // binary packet's json
      this.reconstructor = new BinaryReconstructor(packet);

      // no attachments, labeled binary but no binary data to follow
      if (this.reconstructor.reconPack.attachments === 0) {
        this.emit('decoded', packet);
      }
    } else { // non-binary full packet
      this.emit('decoded', packet);
    }
  } else if (isBuf(obj) || obj.base64) { // raw binary data
    if (!this.reconstructor) {
      throw new Error('got binary data when not reconstructing a packet');
    } else {
      packet = this.reconstructor.takeBinaryData(obj);
      if (packet) { // received final buffer
        this.reconstructor = null;
        this.emit('decoded', packet);
      }
    }
  } else {
    throw new Error('Unknown type: ' + obj);
  }
};

/**
 * Decode a packet String (JSON data)
 *
 * @param {String} str
 * @return {Object} packet
 * @api private
 */

function decodeString(str) {
  var i = 0;
  // look up type
  var p = {
    type: Number(str.charAt(0))
  };

  if (null == exports.types[p.type]) {
    return error('unknown packet type ' + p.type);
  }

  // look up attachments if type binary
  if (exports.BINARY_EVENT === p.type || exports.BINARY_ACK === p.type) {
    var buf = '';
    while (str.charAt(++i) !== '-') {
      buf += str.charAt(i);
      if (i == str.length) break;
    }
    if (buf != Number(buf) || str.charAt(i) !== '-') {
      throw new Error('Illegal attachments');
    }
    p.attachments = Number(buf);
  }

  // look up namespace (if any)
  if ('/' === str.charAt(i + 1)) {
    p.nsp = '';
    while (++i) {
      var c = str.charAt(i);
      if (',' === c) break;
      p.nsp += c;
      if (i === str.length) break;
    }
  } else {
    p.nsp = '/';
  }

  // look up id
  var next = str.charAt(i + 1);
  if ('' !== next && Number(next) == next) {
    p.id = '';
    while (++i) {
      var c = str.charAt(i);
      if (null == c || Number(c) != c) {
        --i;
        break;
      }
      p.id += str.charAt(i);
      if (i === str.length) break;
    }
    p.id = Number(p.id);
  }

  // look up json data
  if (str.charAt(++i)) {
    var payload = tryParse(str.substr(i));
    var isPayloadValid = payload !== false && (p.type === exports.ERROR || isArray(payload));
    if (isPayloadValid) {
      p.data = payload;
    } else {
      return error('invalid payload');
    }
  }

  debug('decoded %s as %j', str, p);
  return p;
}

function tryParse(str) {
  try {
    return JSON.parse(str);
  } catch(e){
    return false;
  }
}

/**
 * Deallocates a parser's resources
 *
 * @api public
 */

Decoder.prototype.destroy = function() {
  if (this.reconstructor) {
    this.reconstructor.finishedReconstruction();
  }
};

/**
 * A manager of a binary event's 'buffer sequence'. Should
 * be constructed whenever a packet of type BINARY_EVENT is
 * decoded.
 *
 * @param {Object} packet
 * @return {BinaryReconstructor} initialized reconstructor
 * @api private
 */

function BinaryReconstructor(packet) {
  this.reconPack = packet;
  this.buffers = [];
}

/**
 * Method to be called when binary data received from connection
 * after a BINARY_EVENT packet.
 *
 * @param {Buffer | ArrayBuffer} binData - the raw binary data received
 * @return {null | Object} returns null if more binary data is expected or
 *   a reconstructed packet object if all buffers have been received.
 * @api private
 */

BinaryReconstructor.prototype.takeBinaryData = function(binData) {
  this.buffers.push(binData);
  if (this.buffers.length === this.reconPack.attachments) { // done with buffer list
    var packet = binary.reconstructPacket(this.reconPack, this.buffers);
    this.finishedReconstruction();
    return packet;
  }
  return null;
};

/**
 * Cleans up binary packet reconstruction variables.
 *
 * @api private
 */

BinaryReconstructor.prototype.finishedReconstruction = function() {
  this.reconPack = null;
  this.buffers = [];
};

function error(msg) {
  return {
    type: exports.ERROR,
    data: 'parser error: ' + msg
  };
}

},{"./binary":42,"./is-buffer":44,"component-emitter":10,"debug":45,"isarray":30}],44:[function(require,module,exports){
(function (Buffer){

module.exports = isBuf;

var withNativeBuffer = typeof Buffer === 'function' && typeof Buffer.isBuffer === 'function';
var withNativeArrayBuffer = typeof ArrayBuffer === 'function';

var isView = function (obj) {
  return typeof ArrayBuffer.isView === 'function' ? ArrayBuffer.isView(obj) : (obj.buffer instanceof ArrayBuffer);
};

/**
 * Returns true if obj is a buffer or an arraybuffer.
 *
 * @api private
 */

function isBuf(obj) {
  return (withNativeBuffer && Buffer.isBuffer(obj)) ||
          (withNativeArrayBuffer && (obj instanceof ArrayBuffer || isView(obj)));
}

}).call(this,require("buffer").Buffer)
},{"buffer":8}],45:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"./debug":46,"_process":34,"dup":21}],46:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22,"ms":31}],47:[function(require,module,exports){
module.exports = toArray

function toArray(list, index) {
    var array = []

    index = index || 0

    for (var i = index || 0; i < list.length; i++) {
        array[i - index] = list[i]
    }

    return array
}

},{}],48:[function(require,module,exports){
!function(t,e){"object"==typeof exports&&"object"==typeof module?module.exports=e():"function"==typeof define&&define.amd?define([],e):"object"==typeof exports?exports.Tone=e():t.Tone=e()}("undefined"!=typeof self?self:this,function(){return function(t){var e={};function i(n){if(e[n])return e[n].exports;var o=e[n]={i:n,l:!1,exports:{}};return t[n].call(o.exports,o,o.exports,i),o.l=!0,o.exports}return i.m=t,i.c=e,i.d=function(t,e,n){i.o(t,e)||Object.defineProperty(t,e,{configurable:!1,enumerable:!0,get:n})},i.r=function(t){Object.defineProperty(t,"__esModule",{value:!0})},i.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return i.d(e,"a",e),e},i.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},i.p="",i(i.s=155)}([function(t,e,i){(function(n){var o,s;
/**
 *  Tone.js
 *  @author Yotam Mann
 *  @license http://opensource.org/licenses/MIT MIT License
 *  @copyright 2014-2019 Yotam Mann
 */o=[i(153)],void 0===(s=function(t){"use strict";var e=function(){if(!(this instanceof e))throw new Error("constructor needs to be called with the 'new' keyword")};return e.prototype.toString=function(){for(var t in e){var i=t[0].match(/^[A-Z]$/),n=e[t]===this.constructor;if(e.isFunction(e[t])&&i&&n)return t}return"Tone"},e.prototype.dispose=function(){return this},e.prototype.set=function(t,i,n){if(e.isObject(t))n=i;else if(e.isString(t)){var o={};o[t]=i,t=o}t:for(var s in t){i=t[s];var r=this;if(-1!==s.indexOf(".")){for(var a=s.split("."),l=0;l<a.length-1;l++)if((r=r[a[l]])instanceof e){a.splice(0,l+1);var h=a.join(".");r.set(h,i);continue t}s=a[a.length-1]}var u=r[s];e.isUndef(u)||(e.Signal&&u instanceof e.Signal||e.Param&&u instanceof e.Param?u.value!==i&&(e.isUndef(n)?u.value=i:u.rampTo(i,n)):u instanceof AudioParam?u.value!==i&&(u.value=i):e.TimeBase&&u instanceof e.TimeBase?r[s]=i:u instanceof e?u.set(i):u!==i&&(r[s]=i))}return this},e.prototype.get=function(t){e.isUndef(t)?t=this._collectDefaults(this.constructor):e.isString(t)&&(t=[t]);for(var i={},n=0;n<t.length;n++){var o=t[n],s=this,r=i;if(-1!==o.indexOf(".")){for(var a=o.split("."),l=0;l<a.length-1;l++){var h=a[l];r[h]=r[h]||{},r=r[h],s=s[h]}o=a[a.length-1]}var u=s[o];e.isObject(t[o])?r[o]=u.get():e.Signal&&u instanceof e.Signal?r[o]=u.value:e.Param&&u instanceof e.Param?r[o]=u.value:u instanceof AudioParam?r[o]=u.value:u instanceof e?r[o]=u.get():!e.isFunction(u)&&e.isDefined(u)&&(r[o]=u)}return i},e.prototype._collectDefaults=function(t){var i=[];if(e.isDefined(t.defaults)&&(i=Object.keys(t.defaults)),e.isDefined(t._super))for(var n=this._collectDefaults(t._super),o=0;o<n.length;o++)-1===i.indexOf(n[o])&&i.push(n[o]);return i},e.defaults=function(t,i,n){var o={};if(1===t.length&&e.isObject(t[0]))o=t[0];else for(var s=0;s<i.length;s++)o[i[s]]=t[s];return e.isDefined(n.defaults)?e.defaultArg(o,n.defaults):e.isObject(n)?e.defaultArg(o,n):o},e.defaultArg=function(t,i){if(e.isObject(t)&&e.isObject(i)){var n={};for(var o in t)n[o]=e.defaultArg(i[o],t[o]);for(var s in i)n[s]=e.defaultArg(t[s],i[s]);return n}return e.isUndef(t)?i:t},e.prototype.log=function(){if(this.debug||this.toString()===e.global.TONE_DEBUG_CLASS){var t=Array.from(arguments);t.unshift(this.toString()+":"),console.log.apply(void 0,t)}},e.prototype.assert=function(t,e){if(!t)throw new Error(e)},e.connectSeries=function(){for(var t=arguments[0],i=1;i<arguments.length;i++){var n=arguments[i];t.connect(n),t=n}return e},e.isUndef=function(t){return void 0===t},e.isDefined=function(t){return!e.isUndef(t)},e.isFunction=function(t){return"function"==typeof t},e.isNumber=function(t){return"number"==typeof t},e.isObject=function(t){return"[object Object]"===Object.prototype.toString.call(t)&&t.constructor===Object},e.isBoolean=function(t){return"boolean"==typeof t},e.isArray=function(t){return Array.isArray(t)},e.isString=function(t){return"string"==typeof t},e.isNote=function(t){return e.isString(t)&&/^([a-g]{1}(?:b|#|x|bb)?)(-?[0-9]+)/i.test(t)},e.noOp=function(){},e.prototype._readOnly=function(t){if(Array.isArray(t))for(var e=0;e<t.length;e++)this._readOnly(t[e]);else Object.defineProperty(this,t,{writable:!1,enumerable:!0})},e.prototype._writable=function(t){if(Array.isArray(t))for(var e=0;e<t.length;e++)this._writable(t[e]);else Object.defineProperty(this,t,{writable:!0})},e.State={Started:"started",Stopped:"stopped",Paused:"paused"},e.global=e.isUndef(n)?window:n,e.equalPowerScale=function(t){var e=.5*Math.PI;return Math.sin(t*e)},e.dbToGain=function(t){return Math.pow(10,t/20)},e.gainToDb=function(t){return Math.log(t)/Math.LN10*20},e.intervalToFrequencyRatio=function(t){return Math.pow(2,t/12)},e.prototype.now=function(){return e.context.now()},e.now=function(){return e.context.now()},e.prototype.immediate=function(){return e.context.currentTime},e.immediate=function(){return e.context.currentTime},e.extend=function(t,i){function n(){}e.isUndef(i)&&(i=e),n.prototype=i.prototype,t.prototype=new n,t.prototype.constructor=t,t._super=i},e._audioContext=null,e.start=function(){return e.context.resume()},Object.defineProperty(e,"context",{get:function(){return e._audioContext},set:function(t){t.isContext?e._audioContext=t:e._audioContext=new e.Context(t),e.Context.emit("init",e._audioContext)}}),Object.defineProperty(e.prototype,"context",{get:function(){return e.context}}),e.setContext=function(t){e.context=t},Object.defineProperty(e.prototype,"blockTime",{get:function(){return 128/this.context.sampleRate}}),Object.defineProperty(e.prototype,"sampleTime",{get:function(){return 1/this.context.sampleRate}}),Object.defineProperty(e,"supported",{get:function(){var t=e.global.hasOwnProperty("AudioContext")||e.global.hasOwnProperty("webkitAudioContext"),i=e.global.hasOwnProperty("Promise");return t&&i}}),Object.defineProperty(e,"initialized",{get:function(){return Boolean(e.context)}}),e.getContext=function(t){if(e.initialized)t(e.context);else{var i=function(){t(e.context),e.Context.off("init",i)};e.Context.on("init",i)}return e},e.version=t,e}.apply(e,o))||(t.exports=s)}).call(this,i(154))},function(t,e,i){var n,o;n=[i(0),i(7),i(4),i(14),i(97),i(3)],void 0===(o=function(t){"use strict";return t.Signal=function(){var e=t.defaults(arguments,["value","units"],t.Signal);t.Param.call(this,e),this._constantSource=this.context.createConstantSource(),this._constantSource.start(0),this._param=this._constantSource.offset,this.value=e.value,this.output=this._constantSource,this.input=this._param=this.output.offset},t.extend(t.Signal,t.Param),t.Signal.defaults={value:0,units:t.Type.Default,convert:!0},t.Signal.prototype.connect=t.SignalBase.prototype.connect,t.Signal.prototype.disconnect=t.SignalBase.prototype.disconnect,t.Signal.prototype.getValueAtTime=function(e){return this._param.getValueAtTime?this._param.getValueAtTime(e):t.Param.prototype.getValueAtTime.call(this,e)},t.Signal.prototype.dispose=function(){return t.Param.prototype.dispose.call(this),this._constantSource.disconnect(),this._constantSource=null,this},t.Signal}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(20)],void 0===(o=function(t){return t.AudioNode=function(){t.call(this);var e=t.defaults(arguments,["context"],{context:t.context});this._context=e.context},t.extend(t.AudioNode),Object.defineProperty(t.AudioNode.prototype,"context",{get:function(){return this._context}}),t.AudioNode.prototype.createInsOuts=function(t,e){1===t?this.input=this.context.createGain():t>1&&(this.input=new Array(t)),1===e?this.output=this.context.createGain():e>1&&(this.output=new Array(e))},Object.defineProperty(t.AudioNode.prototype,"channelCount",{get:function(){return this.output.channelCount},set:function(t){return this.output.channelCount=t}}),Object.defineProperty(t.AudioNode.prototype,"channelCountMode",{get:function(){return this.output.channelCountMode},set:function(t){return this.output.channelCountMode=t}}),Object.defineProperty(t.AudioNode.prototype,"channelInterpretation",{get:function(){return this.output.channelInterpretation},set:function(t){return this.output.channelInterpretation=t}}),Object.defineProperty(t.AudioNode.prototype,"numberOfInputs",{get:function(){return this.input?t.isArray(this.input)?this.input.length:1:0}}),Object.defineProperty(t.AudioNode.prototype,"numberOfOutputs",{get:function(){return this.output?t.isArray(this.output)?this.output.length:1:0}}),t.AudioNode.prototype.connect=function(e,i,n){return t.isArray(this.output)?(i=t.defaultArg(i,0),this.output[i].connect(e,0,n)):this.output.connect(e,i,n),this},t.AudioNode.prototype.disconnect=function(e,i,n){t.isArray(this.output)?t.isNumber(e)?this.output[e].disconnect():(i=t.defaultArg(i,0),this.output[i].disconnect(e,0,n)):this.output.disconnect.apply(this.output,arguments)},t.AudioNode.prototype.chain=function(){for(var t=this,e=0;e<arguments.length;e++){var i=arguments[e];t.connect(i),t=i}return this},t.AudioNode.prototype.fan=function(){for(var t=0;t<arguments.length;t++)this.connect(arguments[t]);return this},t.global.AudioNode&&(AudioNode.prototype.chain=t.AudioNode.prototype.chain,AudioNode.prototype.fan=t.AudioNode.prototype.fan),t.AudioNode.prototype.dispose=function(){return t.isDefined(this.input)&&(this.input instanceof AudioNode&&this.input.disconnect(),this.input=null),t.isDefined(this.output)&&(this.output instanceof AudioNode&&this.output.disconnect(),this.output=null),this._context=null,this},t.AudioNode}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(14),i(4),i(2)],void 0===(o=function(t){"use strict";return t.Gain=function(){var e=t.defaults(arguments,["gain","units"],t.Gain);t.AudioNode.call(this,e),this.input=this.output=this._gainNode=this.context.createGain(),this.gain=new t.Param({param:this._gainNode.gain,units:e.units,value:e.gain,convert:e.convert}),this._readOnly("gain")},t.extend(t.Gain,t.AudioNode),t.Gain.defaults={gain:1,convert:!0},t.Gain.prototype.dispose=function(){t.AudioNode.prototype.dispose.call(this),this._gainNode.disconnect(),this._gainNode=null,this._writable("gain"),this.gain.dispose(),this.gain=null},t.Gain}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(65),i(46),i(45),i(20)],void 0===(o=function(t){return t.Type={Default:"number",Time:"time",Frequency:"frequency",TransportTime:"transportTime",Ticks:"ticks",NormalRange:"normalRange",AudioRange:"audioRange",Decibels:"db",Interval:"interval",BPM:"bpm",Positive:"positive",Gain:"gain",Cents:"cents",Degrees:"degrees",MIDI:"midi",BarsBeatsSixteenths:"barsBeatsSixteenths",Samples:"samples",Hertz:"hertz",Note:"note",Milliseconds:"milliseconds",Seconds:"seconds",Notation:"notation"},t.prototype.toSeconds=function(e){return t.isNumber(e)?e:t.isUndef(e)?this.now():t.isString(e)||t.isObject(e)?new t.Time(e).toSeconds():e instanceof t.TimeBase?e.toSeconds():void 0},t.prototype.toFrequency=function(e){return t.isNumber(e)?e:t.isString(e)||t.isUndef(e)||t.isObject(e)?new t.Frequency(e).valueOf():e instanceof t.TimeBase?e.toFrequency():void 0},t.prototype.toTicks=function(e){return t.isNumber(e)||t.isString(e)||t.isObject(e)?new t.TransportTime(e).toTicks():t.isUndef(e)?t.Transport.ticks:e instanceof t.TimeBase?e.toTicks():void 0},t}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(14),i(3),i(36)],void 0===(o=function(t){"use strict";return t.Multiply=function(e){t.Signal.call(this),this.createInsOuts(2,0),this._mult=this.input[0]=this.output=new t.Gain,this._param=this.input[1]=this.output.gain,this.value=t.defaultArg(e,0),this.proxy=!1},t.extend(t.Multiply,t.Signal),t.Multiply.prototype.dispose=function(){return t.Signal.prototype.dispose.call(this),this._mult.dispose(),this._mult=null,this._param=null,this},t.Multiply}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(16),i(27),i(40),i(4),i(33),i(1),i(2)],void 0===(o=function(t){"use strict";return t.Source=function(e){e=t.defaultArg(e,t.Source.defaults),t.AudioNode.call(this),this._volume=this.output=new t.Volume(e.volume),this.volume=this._volume.volume,this._readOnly("volume"),this._state=new t.TimelineState(t.State.Stopped),this._state.memory=100,this._synced=!1,this._scheduled=[],this._volume.output.output.channelCount=2,this._volume.output.output.channelCountMode="explicit",this.mute=e.mute},t.extend(t.Source,t.AudioNode),t.Source.defaults={volume:0,mute:!1},Object.defineProperty(t.Source.prototype,"state",{get:function(){return this._synced?t.Transport.state===t.State.Started?this._state.getValueAtTime(t.Transport.seconds):t.State.Stopped:this._state.getValueAtTime(this.now())}}),Object.defineProperty(t.Source.prototype,"mute",{get:function(){return this._volume.mute},set:function(t){this._volume.mute=t}}),t.Source.prototype._start=t.noOp,t.Source.prototype.restart=t.noOp,t.Source.prototype._stop=t.noOp,t.Source.prototype.start=function(e,i,n){if(e=t.isUndef(e)&&this._synced?t.Transport.seconds:this.toSeconds(e),this._state.getValueAtTime(e)===t.State.Started)this._state.cancel(e),this._state.setStateAtTime(t.State.Started,e),this.restart(e,i,n);else if(this._state.setStateAtTime(t.State.Started,e),this._synced){var o=this._state.get(e);o.offset=t.defaultArg(i,0),o.duration=n;var s=t.Transport.schedule(function(t){this._start(t,i,n)}.bind(this),e);this._scheduled.push(s),t.Transport.state===t.State.Started&&this._syncedStart(this.now(),t.Transport.seconds)}else this._start.apply(this,arguments);return this},t.Source.prototype.stop=function(e){if(e=t.isUndef(e)&&this._synced?t.Transport.seconds:this.toSeconds(e),this._synced){var i=t.Transport.schedule(this._stop.bind(this),e);this._scheduled.push(i)}else this._stop.apply(this,arguments);return this._state.cancel(e),this._state.setStateAtTime(t.State.Stopped,e),this},t.Source.prototype.sync=function(){return this._synced=!0,this._syncedStart=function(e,i){if(i>0){var n=this._state.get(i);if(n&&n.state===t.State.Started&&n.time!==i){var o,s=i-this.toSeconds(n.time);n.duration&&(o=this.toSeconds(n.duration)-s),this._start(e,this.toSeconds(n.offset)+s,o)}}}.bind(this),this._syncedStop=function(e){var i=t.Transport.getSecondsAtTime(Math.max(e-this.sampleTime,0));this._state.getValueAtTime(i)===t.State.Started&&this._stop(e)}.bind(this),t.Transport.on("start loopStart",this._syncedStart),t.Transport.on("stop pause loopEnd",this._syncedStop),this},t.Source.prototype.unsync=function(){this._synced&&(t.Transport.off("stop pause loopEnd",this._syncedStop),t.Transport.off("start loopStart",this._syncedStart)),this._synced=!1;for(var e=0;e<this._scheduled.length;e++){var i=this._scheduled[e];t.Transport.clear(i)}return this._scheduled=[],this._state.cancel(0),this},t.Source.prototype.dispose=function(){t.AudioNode.prototype.dispose.call(this),this.unsync(),this._scheduled=null,this._writable("volume"),this._volume.dispose(),this._volume=null,this.volume=null,this._state.dispose(),this._state=null},t.Source}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(36),i(98)],void 0===(o=function(t){"use strict";return t.WaveShaper=function(e,i){t.SignalBase.call(this),this._shaper=this.input=this.output=this.context.createWaveShaper(),this._curve=null,Array.isArray(e)?this.curve=e:isFinite(e)||t.isUndef(e)?this._curve=new Float32Array(t.defaultArg(e,1024)):t.isFunction(e)&&(this._curve=new Float32Array(t.defaultArg(i,1024)),this.setMap(e))},t.extend(t.WaveShaper,t.SignalBase),t.WaveShaper.prototype.setMap=function(t){for(var e=new Array(this._curve.length),i=0,n=this._curve.length;i<n;i++){var o=i/(n-1)*2-1;e[i]=t(o,i)}return this.curve=e,this},Object.defineProperty(t.WaveShaper.prototype,"curve",{get:function(){return this._shaper.curve},set:function(t){this._curve=new Float32Array(t),this._shaper.curve=this._curve}}),Object.defineProperty(t.WaveShaper.prototype,"oversample",{get:function(){return this._shaper.oversample},set:function(t){if(!["none","2x","4x"].includes(t))throw new RangeError("Tone.WaveShaper: oversampling must be either 'none', '2x', or '4x'");this._shaper.oversample=t}}),t.WaveShaper.prototype.dispose=function(){return t.SignalBase.prototype.dispose.call(this),this._shaper.disconnect(),this._shaper=null,this._curve=null,this},t.WaveShaper}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(23),i(2)],void 0===(o=function(t){"use strict";return t.Effect=function(){var e=t.defaults(arguments,["wet"],t.Effect);t.AudioNode.call(this),this.createInsOuts(1,1),this._dryWet=new t.CrossFade(e.wet),this.wet=this._dryWet.fade,this.effectSend=new t.Gain,this.effectReturn=new t.Gain,this.input.connect(this._dryWet.a),this.input.connect(this.effectSend),this.effectReturn.connect(this._dryWet.b),this._dryWet.connect(this.output),this._readOnly(["wet"])},t.extend(t.Effect,t.AudioNode),t.Effect.defaults={wet:1},t.Effect.prototype.connectEffect=function(t){return this.effectSend.chain(t,this.effectReturn),this},t.Effect.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._dryWet.dispose(),this._dryWet=null,this.effectSend.dispose(),this.effectSend=null,this.effectReturn.dispose(),this.effectReturn=null,this._writable(["wet"]),this.wet=null,this},t.Effect}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(1),i(2)],void 0===(o=function(t){"use strict";return t.Filter=function(){var e=t.defaults(arguments,["frequency","type","rolloff"],t.Filter);t.AudioNode.call(this),this.createInsOuts(1,1),this._filters=[],this.frequency=new t.Signal(e.frequency,t.Type.Frequency),this.detune=new t.Signal(0,t.Type.Cents),this.gain=new t.Signal({value:e.gain,convert:!0,type:t.Type.Decibels}),this.Q=new t.Signal(e.Q),this._type=e.type,this._rolloff=e.rolloff,this.rolloff=e.rolloff,this._readOnly(["detune","frequency","gain","Q"])},t.extend(t.Filter,t.AudioNode),t.Filter.defaults={type:"lowpass",frequency:350,rolloff:-12,Q:1,gain:0},Object.defineProperty(t.Filter.prototype,"type",{get:function(){return this._type},set:function(t){if(-1===["lowpass","highpass","bandpass","lowshelf","highshelf","notch","allpass","peaking"].indexOf(t))throw new TypeError("Tone.Filter: invalid type "+t);this._type=t;for(var e=0;e<this._filters.length;e++)this._filters[e].type=t}}),Object.defineProperty(t.Filter.prototype,"rolloff",{get:function(){return this._rolloff},set:function(e){e=parseInt(e,10);var i=[-12,-24,-48,-96].indexOf(e);if(-1===i)throw new RangeError("Tone.Filter: rolloff can only be -12, -24, -48 or -96");i+=1,this._rolloff=e,this.input.disconnect();for(var n=0;n<this._filters.length;n++)this._filters[n].disconnect(),this._filters[n]=null;this._filters=new Array(i);for(var o=0;o<i;o++){var s=this.context.createBiquadFilter();s.type=this._type,this.frequency.connect(s.frequency),this.detune.connect(s.detune),this.Q.connect(s.Q),this.gain.connect(s.gain),this._filters[o]=s}var r=[this.input].concat(this._filters).concat([this.output]);t.connectSeries.apply(t,r)}}),t.Filter.prototype.getFrequencyResponse=function(e){e=t.defaultArg(e,128);for(var i=new Float32Array(e).map(function(){return 1}),n=new Float32Array(e),o=0;o<e;o++){var s=19980*Math.pow(o/e,2)+20;n[o]=s}var r=new Float32Array(e),a=new Float32Array(e);return this._filters.forEach(function(){var t=this.context.createBiquadFilter();t.type=this._type,t.Q.value=this.Q.value,t.frequency.value=this.frequency.value,t.gain.value=this.gain.value,t.getFrequencyResponse(n,r,a),r.forEach(function(t,e){i[e]*=t})}.bind(this)),i},t.Filter.prototype.dispose=function(){t.AudioNode.prototype.dispose.call(this);for(var e=0;e<this._filters.length;e++)this._filters[e].disconnect(),this._filters[e]=null;return this._filters=null,this._writable(["detune","frequency","gain","Q"]),this.frequency.dispose(),this.Q.dispose(),this.frequency=null,this.Q=null,this.detune.dispose(),this.detune=null,this.gain.dispose(),this.gain=null,this},t.Filter}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(2)],void 0===(o=function(t){"use strict";return t.Merge=function(){t.AudioNode.call(this),this.createInsOuts(2,0),this.left=this.input[0]=new t.Gain,this.right=this.input[1]=new t.Gain,this._merger=this.output=this.context.createChannelMerger(2),this.left.connect(this._merger,0,0),this.right.connect(this._merger,0,1),this.left.channelCount=1,this.right.channelCount=1,this.left.channelCountMode="explicit",this.right.channelCountMode="explicit"},t.extend(t.Merge,t.AudioNode),t.Merge.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this.left.dispose(),this.left=null,this.right.dispose(),this.right=null,this._merger.disconnect(),this._merger=null,this},t.Merge}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(35),i(4),i(81)],void 0===(o=function(t){"use strict";return t.Buffer=function(){var e=t.defaults(arguments,["url","onload","onerror"],t.Buffer);t.call(this),this._buffer=null,this._reversed=e.reverse,this._xhr=null,this.onload=t.noOp,e.url instanceof AudioBuffer||e.url instanceof t.Buffer?(this.set(e.url),this.loaded||(this.onload=e.onload)):t.isString(e.url)&&this.load(e.url).then(e.onload).catch(e.onerror)},t.extend(t.Buffer),t.Buffer.defaults={url:void 0,reverse:!1,onload:t.noOp,onerror:t.noOp},t.Buffer.prototype.set=function(e){return e instanceof t.Buffer?e.loaded?this._buffer=e.get():e.onload=function(){this.set(e),this.onload(this)}.bind(this):this._buffer=e,this},t.Buffer.prototype.get=function(){return this._buffer},t.Buffer.prototype.load=function(e,i,n){return new Promise(function(o,s){this._xhr=t.Buffer.load(e,function(t){this._xhr=null,this.set(t),o(this),this.onload(this),i&&i(this)}.bind(this),function(t){this._xhr=null,s(t),n&&n(t)}.bind(this))}.bind(this))},t.Buffer.prototype.dispose=function(){return t.prototype.dispose.call(this),this._buffer=null,this._xhr&&(t.Buffer._removeFromDownloadQueue(this._xhr),this._xhr.abort(),this._xhr=null),this},Object.defineProperty(t.Buffer.prototype,"loaded",{get:function(){return this.length>0}}),Object.defineProperty(t.Buffer.prototype,"duration",{get:function(){return this._buffer?this._buffer.duration:0}}),Object.defineProperty(t.Buffer.prototype,"length",{get:function(){return this._buffer?this._buffer.length:0}}),Object.defineProperty(t.Buffer.prototype,"numberOfChannels",{get:function(){return this._buffer?this._buffer.numberOfChannels:0}}),t.Buffer.prototype.fromArray=function(t){var e=t[0].length>0,i=e?t.length:1,n=e?t[0].length:t.length,o=this.context.createBuffer(i,n,this.context.sampleRate);e||1!==i||(t=[t]);for(var s=0;s<i;s++)o.copyToChannel(t[s],s);return this._buffer=o,this},t.Buffer.prototype.toMono=function(e){if(t.isNumber(e))this.fromArray(this.toArray(e));else{for(var i=new Float32Array(this.length),n=this.numberOfChannels,o=0;o<n;o++)for(var s=this.toArray(o),r=0;r<s.length;r++)i[r]+=s[r];i=i.map(function(t){return t/n}),this.fromArray(i)}return this},t.Buffer.prototype.toArray=function(e){if(t.isNumber(e))return this.getChannelData(e);if(1===this.numberOfChannels)return this.toArray(0);for(var i=[],n=0;n<this.numberOfChannels;n++)i[n]=this.getChannelData(n);return i},t.Buffer.prototype.getChannelData=function(t){return this._buffer.getChannelData(t)},t.Buffer.prototype.slice=function(e,i){i=t.defaultArg(i,this.duration);for(var n=Math.floor(this.context.sampleRate*this.toSeconds(e)),o=Math.floor(this.context.sampleRate*this.toSeconds(i)),s=[],r=0;r<this.numberOfChannels;r++)s[r]=this.toArray(r).slice(n,o);return(new t.Buffer).fromArray(s)},t.Buffer.prototype._reverse=function(){if(this.loaded)for(var t=0;t<this.numberOfChannels;t++)Array.prototype.reverse.call(this.getChannelData(t));return this},Object.defineProperty(t.Buffer.prototype,"reverse",{get:function(){return this._reversed},set:function(t){this._reversed!==t&&(this._reversed=t,this._reverse())}}),t.Emitter.mixin(t.Buffer),t.Buffer._downloadQueue=[],t.Buffer.baseUrl="",t.Buffer.fromArray=function(e){return(new t.Buffer).fromArray(e)},t.Buffer.fromUrl=function(e){var i=new t.Buffer;return i.load(e).then(function(){return i})},t.Buffer._removeFromDownloadQueue=function(e){var i=t.Buffer._downloadQueue.indexOf(e);-1!==i&&t.Buffer._downloadQueue.splice(i,1)},t.Buffer.load=function(e,i,n){i=t.defaultArg(i,t.noOp);var o=e.match(/\[(.+\|?)+\]$/);if(o){for(var s=o[1].split("|"),r=s[0],a=0;a<s.length;a++)if(t.Buffer.supportsType(s[a])){r=s[a];break}e=e.replace(o[0],r)}function l(e){if(t.Buffer._removeFromDownloadQueue(u),t.Buffer.emit("error",e),!n)throw e;n(e)}function h(){for(var e=0,i=0;i<t.Buffer._downloadQueue.length;i++)e+=t.Buffer._downloadQueue[i].progress;t.Buffer.emit("progress",e/t.Buffer._downloadQueue.length)}var u=new XMLHttpRequest;return u.open("GET",t.Buffer.baseUrl+e,!0),u.responseType="arraybuffer",u.progress=0,t.Buffer._downloadQueue.push(u),u.addEventListener("load",function(){200===u.status?t.context.decodeAudioData(u.response).then(function(e){u.progress=1,h(),i(e),t.Buffer._removeFromDownloadQueue(u),0===t.Buffer._downloadQueue.length&&t.Buffer.emit("load")}).catch(function(){t.Buffer._removeFromDownloadQueue(u),l("Tone.Buffer: could not decode audio data: "+e)}):l("Tone.Buffer: could not locate file: "+e)}),u.addEventListener("error",l),u.addEventListener("progress",function(t){t.lengthComputable&&(u.progress=t.loaded/t.total*.95,h())}),u.send(),u},t.Buffer.cancelDownloads=function(){return t.Buffer._downloadQueue.slice().forEach(function(e){t.Buffer._removeFromDownloadQueue(e),e.abort()}),t.Buffer},t.Buffer.supportsType=function(t){var e=t.split(".");return e=e[e.length-1],""!==document.createElement("audio").canPlayType("audio/"+e)},t.loaded=function(){var e,i;function n(){t.Buffer.off("load",e),t.Buffer.off("error",i)}return new Promise(function(n,o){e=function(){n()},i=function(){o()},t.Buffer.on("load",e),t.Buffer.on("error",i)}).then(n).catch(function(t){throw n(),new Error(t)})},t.Buffer}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(17),i(26),i(2),i(1),i(22),i(4),i(28)],void 0===(o=function(t){"use strict";return t.LFO=function(){var e=t.defaults(arguments,["frequency","min","max"],t.LFO);t.AudioNode.call(this),this._oscillator=new t.Oscillator({frequency:e.frequency,type:e.type}),this.frequency=this._oscillator.frequency,this.amplitude=this._oscillator.volume,this.amplitude.units=t.Type.NormalRange,this.amplitude.value=e.amplitude,this._stoppedSignal=new t.Signal(0,t.Type.AudioRange),this._zeros=new t.Zero,this._stoppedValue=0,this._a2g=new t.AudioToGain,this._scaler=this.output=new t.Scale(e.min,e.max),this._units=t.Type.Default,this.units=e.units,this._oscillator.chain(this._a2g,this._scaler),this._zeros.connect(this._a2g),this._stoppedSignal.connect(this._a2g),this._readOnly(["amplitude","frequency"]),this.phase=e.phase},t.extend(t.LFO,t.AudioNode),t.LFO.defaults={type:"sine",min:0,max:1,phase:0,frequency:"4n",amplitude:1,units:t.Type.Default},t.LFO.prototype.start=function(t){return t=this.toSeconds(t),this._stoppedSignal.setValueAtTime(0,t),this._oscillator.start(t),this},t.LFO.prototype.stop=function(t){return t=this.toSeconds(t),this._stoppedSignal.setValueAtTime(this._stoppedValue,t),this._oscillator.stop(t),this},t.LFO.prototype.sync=function(){return this._oscillator.sync(),this._oscillator.syncFrequency(),this},t.LFO.prototype.unsync=function(){return this._oscillator.unsync(),this._oscillator.unsyncFrequency(),this},Object.defineProperty(t.LFO.prototype,"min",{get:function(){return this._toUnits(this._scaler.min)},set:function(t){t=this._fromUnits(t),this._scaler.min=t}}),Object.defineProperty(t.LFO.prototype,"max",{get:function(){return this._toUnits(this._scaler.max)},set:function(t){t=this._fromUnits(t),this._scaler.max=t}}),Object.defineProperty(t.LFO.prototype,"type",{get:function(){return this._oscillator.type},set:function(t){this._oscillator.type=t,this._stoppedValue=this._oscillator._getInitialValue(),this._stoppedSignal.value=this._stoppedValue}}),Object.defineProperty(t.LFO.prototype,"phase",{get:function(){return this._oscillator.phase},set:function(t){this._oscillator.phase=t,this._stoppedValue=this._oscillator._getInitialValue(),this._stoppedSignal.value=this._stoppedValue}}),Object.defineProperty(t.LFO.prototype,"units",{get:function(){return this._units},set:function(t){var e=this.min,i=this.max;this._units=t,this.min=e,this.max=i}}),Object.defineProperty(t.LFO.prototype,"mute",{get:function(){return this._oscillator.mute},set:function(t){this._oscillator.mute=t}}),Object.defineProperty(t.LFO.prototype,"state",{get:function(){return this._oscillator.state}}),t.LFO.prototype.connect=function(e){return e.constructor!==t.Signal&&e.constructor!==t.Param||(this.convert=e.convert,this.units=e.units),t.SignalBase.prototype.connect.apply(this,arguments),this},t.LFO.prototype._fromUnits=t.Param.prototype._fromUnits,t.LFO.prototype._toUnits=t.Param.prototype._toUnits,t.LFO.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._writable(["amplitude","frequency"]),this._oscillator.dispose(),this._oscillator=null,this._stoppedSignal.dispose(),this._stoppedSignal=null,this._zeros.dispose(),this._zeros=null,this._scaler.dispose(),this._scaler=null,this._a2g.dispose(),this._a2g=null,this.frequency=null,this.amplitude=null,this},t.LFO}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(29),i(94),i(1),i(3)],void 0===(o=function(t){"use strict";return t.Subtract=function(e){t.Signal.call(this),this.createInsOuts(2,0),this._sum=this.input[0]=this.output=new t.Gain,this._neg=new t.Negate,this._param=this.input[1]=new t.Signal(e),this._param.chain(this._neg,this._sum),this.proxy=!1},t.extend(t.Subtract,t.Signal),t.Subtract.prototype.dispose=function(){return t.Signal.prototype.dispose.call(this),this._neg.dispose(),this._neg=null,this._sum.disconnect(),this._sum=null,this},t.Subtract}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(4),i(2),i(24)],void 0===(o=function(t){"use strict";return t.Param=function(){var e=t.defaults(arguments,["param","units","convert"],t.Param);t.AudioNode.call(this,e),this._param=this.input=e.param,this.units=e.units,this.convert=e.convert,this.overridden=!1,this._events=new t.Timeline(1e3),t.isDefined(e.value)&&this._param&&this.setValueAtTime(e.value,0)},t.extend(t.Param,t.AudioNode),t.Param.defaults={units:t.Type.Default,convert:!0,param:void 0},Object.defineProperty(t.Param.prototype,"value",{get:function(){var t=this.now();return this._toUnits(this.getValueAtTime(t))},set:function(t){this._initialValue=this._fromUnits(t),this.cancelScheduledValues(this.now()),this.setValueAtTime(t,this.now())}}),Object.defineProperty(t.Param.prototype,"minValue",{get:function(){return this.units===t.Type.Time||this.units===t.Type.Frequency||this.units===t.Type.NormalRange||this.units===t.Type.Positive||this.units===t.Type.BPM?0:this.units===t.Type.AudioRange?-1:this.units===t.Type.Decibels?-1/0:this._param.minValue}}),Object.defineProperty(t.Param.prototype,"maxValue",{get:function(){return this.units===t.Type.NormalRange||this.units===t.Type.AudioRange?1:this._param.maxValue}}),t.Param.prototype._fromUnits=function(e){if(!this.convert&&!t.isUndef(this.convert)||this.overridden)return e;switch(this.units){case t.Type.Time:return this.toSeconds(e);case t.Type.Frequency:return this.toFrequency(e);case t.Type.Decibels:return t.dbToGain(e);case t.Type.NormalRange:return Math.min(Math.max(e,0),1);case t.Type.AudioRange:return Math.min(Math.max(e,-1),1);case t.Type.Positive:return Math.max(e,0);default:return e}},t.Param.prototype._toUnits=function(e){if(!this.convert&&!t.isUndef(this.convert))return e;switch(this.units){case t.Type.Decibels:return t.gainToDb(e);default:return e}},t.Param.prototype._minOutput=1e-5,t.Param.AutomationType={Linear:"linearRampToValueAtTime",Exponential:"exponentialRampToValueAtTime",Target:"setTargetAtTime",SetValue:"setValueAtTime",Cancel:"cancelScheduledValues"},t.Param.prototype.setValueAtTime=function(e,i){return i=this.toSeconds(i),e=this._fromUnits(e),this._events.add({type:t.Param.AutomationType.SetValue,value:e,time:i}),this.log(t.Param.AutomationType.SetValue,e,i),this._param.setValueAtTime(e,i),this},t.Param.prototype.getValueAtTime=function(e){e=this.toSeconds(e);var i=this._events.getAfter(e),n=this._events.get(e),o=t.defaultArg(this._initialValue,this._param.defaultValue),s=o;if(null===n)s=o;else if(n.type===t.Param.AutomationType.Target){var r,a=this._events.getBefore(n.time);r=null===a?o:a.value,s=this._exponentialApproach(n.time,r,n.value,n.constant,e)}else s=null===i?n.value:i.type===t.Param.AutomationType.Linear?this._linearInterpolate(n.time,n.value,i.time,i.value,e):i.type===t.Param.AutomationType.Exponential?this._exponentialInterpolate(n.time,n.value,i.time,i.value,e):n.value;return s},t.Param.prototype.setRampPoint=function(t){t=this.toSeconds(t);var e=this.getValueAtTime(t);return this.cancelAndHoldAtTime(t),0===e&&(e=this._minOutput),this.setValueAtTime(this._toUnits(e),t),this},t.Param.prototype.linearRampToValueAtTime=function(e,i){return e=this._fromUnits(e),i=this.toSeconds(i),this._events.add({type:t.Param.AutomationType.Linear,value:e,time:i}),this.log(t.Param.AutomationType.Linear,e,i),this._param.linearRampToValueAtTime(e,i),this},t.Param.prototype.exponentialRampToValueAtTime=function(e,i){return e=this._fromUnits(e),e=Math.max(this._minOutput,e),i=this.toSeconds(i),this._events.add({type:t.Param.AutomationType.Exponential,time:i,value:e}),this.log(t.Param.AutomationType.Exponential,e,i),this._param.exponentialRampToValueAtTime(e,i),this},t.Param.prototype.exponentialRampTo=function(t,e,i){return i=this.toSeconds(i),this.setRampPoint(i),this.exponentialRampToValueAtTime(t,i+this.toSeconds(e)),this},t.Param.prototype.linearRampTo=function(t,e,i){return i=this.toSeconds(i),this.setRampPoint(i),this.linearRampToValueAtTime(t,i+this.toSeconds(e)),this},t.Param.prototype.targetRampTo=function(t,e,i){return i=this.toSeconds(i),this.setRampPoint(i),this.exponentialApproachValueAtTime(t,i,e),this},t.Param.prototype.exponentialApproachValueAtTime=function(t,e,i){var n=Math.log(this.toSeconds(i)+1)/Math.log(200);return e=this.toSeconds(e),this.setTargetAtTime(t,e,n)},t.Param.prototype.setTargetAtTime=function(e,i,n){if(e=this._fromUnits(e),n<=0)throw new Error("timeConstant must be greater than 0");return i=this.toSeconds(i),this._events.add({type:t.Param.AutomationType.Target,value:e,time:i,constant:n}),this.log(t.Param.AutomationType.Target,e,i,n),this._param.setTargetAtTime(e,i,n),this},t.Param.prototype.setValueCurveAtTime=function(e,i,n,o){o=t.defaultArg(o,1),n=this.toSeconds(n),i=this.toSeconds(i),this.setValueAtTime(e[0]*o,i);for(var s=n/(e.length-1),r=1;r<e.length;r++)this.linearRampToValueAtTime(e[r]*o,i+r*s);return this},t.Param.prototype.cancelScheduledValues=function(e){return e=this.toSeconds(e),this._events.cancel(e),this._param.cancelScheduledValues(e),this.log(t.Param.AutomationType.Cancel,e),this},t.Param.prototype.cancelAndHoldAtTime=function(e){var i=this.getValueAtTime(e);this.log("cancelAndHoldAtTime",e,"value="+i),this._param.cancelScheduledValues(e);var n=this._events.get(e),o=this._events.getAfter(e);return n&&n.time===e?o?this._events.cancel(o.time):this._events.cancel(e+this.sampleTime):o&&(this._events.cancel(o.time),o.type===t.Param.AutomationType.Linear?this.linearRampToValueAtTime(i,e):o.type===t.Param.AutomationType.Exponential&&this.exponentialRampToValueAtTime(i,e)),this._events.add({type:t.Param.AutomationType.SetValue,value:i,time:e}),this._param.setValueAtTime(i,e),this},t.Param.prototype.rampTo=function(e,i,n){return i=t.defaultArg(i,.1),this.units===t.Type.Frequency||this.units===t.Type.BPM||this.units===t.Type.Decibels?this.exponentialRampTo(e,i,n):this.linearRampTo(e,i,n),this},t.Param.prototype._exponentialApproach=function(t,e,i,n,o){return i+(e-i)*Math.exp(-(o-t)/n)},t.Param.prototype._linearInterpolate=function(t,e,i,n,o){return e+(o-t)/(i-t)*(n-e)},t.Param.prototype._exponentialInterpolate=function(t,e,i,n,o){return e*Math.pow(n/e,(o-t)/(i-t))},t.Param.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._param=null,this._events=null,this},t.Param}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(8),i(19),i(10),i(23)],void 0===(o=function(t){"use strict";return t.StereoEffect=function(){t.AudioNode.call(this);var e=t.defaults(arguments,["wet"],t.Effect);this.createInsOuts(1,1),this._dryWet=new t.CrossFade(e.wet),this.wet=this._dryWet.fade,this._split=new t.Split,this.effectSendL=this._split.left,this.effectSendR=this._split.right,this._merge=new t.Merge,this.effectReturnL=this._merge.left,this.effectReturnR=this._merge.right,this.input.connect(this._split),this.input.connect(this._dryWet,0,0),this._merge.connect(this._dryWet,0,1),this._dryWet.connect(this.output),this._readOnly(["wet"])},t.extend(t.StereoEffect,t.Effect),t.StereoEffect.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._dryWet.dispose(),this._dryWet=null,this._split.dispose(),this._split=null,this._merge.dispose(),this._merge=null,this.effectSendL=null,this.effectSendR=null,this.effectReturnL=null,this.effectReturnR=null,this._writable(["wet"]),this.wet=null,this},t.StereoEffect}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(86),i(4),i(24),i(35),i(3),i(84),i(83),i(55)],void 0===(o=function(t){"use strict";t.Transport=function(){t.Emitter.call(this),t.getContext(function(){this.loop=!1,this._loopStart=0,this._loopEnd=0,this._ppq=e.defaults.PPQ,this._clock=new t.Clock({callback:this._processTick.bind(this),frequency:0}),this._bindClockEvents(),this.bpm=this._clock.frequency,this.bpm._toUnits=this._toUnits.bind(this),this.bpm._fromUnits=this._fromUnits.bind(this),this.bpm.units=t.Type.BPM,this.bpm.value=e.defaults.bpm,this._readOnly("bpm"),this._timeSignature=e.defaults.timeSignature,this._scheduledEvents={},this._timeline=new t.Timeline,this._repeatedEvents=new t.IntervalTimeline,this._syncedSignals=[],this._swingTicks=e.defaults.PPQ/2,this._swingAmount=0,this.context.transport=this}.bind(this))},t.extend(t.Transport,t.Emitter),t.Transport.defaults={bpm:120,swing:0,swingSubdivision:"8n",timeSignature:4,loopStart:0,loopEnd:"4m",PPQ:192},t.Transport.prototype.isTransport=!0,t.Transport.prototype._processTick=function(e,i){if(this._swingAmount>0&&i%this._ppq!=0&&i%(2*this._swingTicks)!=0){var n=i%(2*this._swingTicks)/(2*this._swingTicks),o=Math.sin(n*Math.PI)*this._swingAmount;e+=t.Ticks(2*this._swingTicks/3).toSeconds()*o}this.loop&&i>=this._loopEnd&&(this.emit("loopEnd",e),this._clock.setTicksAtTime(this._loopStart,e),i=this._loopStart,this.emit("loopStart",e,this._clock.getSecondsAtTime(e)),this.emit("loop",e)),this._timeline.forEachAtTime(i,function(t){t.invoke(e)})},t.Transport.prototype.schedule=function(e,i){var n=new t.TransportEvent(this,{time:t.TransportTime(i),callback:e});return this._addEvent(n,this._timeline)},t.Transport.prototype.scheduleRepeat=function(e,i,n,o){var s=new t.TransportRepeatEvent(this,{callback:e,interval:t.Time(i),time:t.TransportTime(n),duration:t.Time(t.defaultArg(o,1/0))});return this._addEvent(s,this._repeatedEvents)},t.Transport.prototype.scheduleOnce=function(e,i){var n=new t.TransportEvent(this,{time:t.TransportTime(i),callback:e,once:!0});return this._addEvent(n,this._timeline)},t.Transport.prototype.clear=function(t){if(this._scheduledEvents.hasOwnProperty(t)){var e=this._scheduledEvents[t.toString()];e.timeline.remove(e.event),e.event.dispose(),delete this._scheduledEvents[t.toString()]}return this},t.Transport.prototype._addEvent=function(t,e){return this._scheduledEvents[t.id.toString()]={event:t,timeline:e},e.add(t),t.id},t.Transport.prototype.cancel=function(e){return e=t.defaultArg(e,0),e=this.toTicks(e),this._timeline.forEachFrom(e,function(t){this.clear(t.id)}.bind(this)),this._repeatedEvents.forEachFrom(e,function(t){this.clear(t.id)}.bind(this)),this},t.Transport.prototype._bindClockEvents=function(){this._clock.on("start",function(e,i){i=t.Ticks(i).toSeconds(),this.emit("start",e,i)}.bind(this)),this._clock.on("stop",function(t){this.emit("stop",t)}.bind(this)),this._clock.on("pause",function(t){this.emit("pause",t)}.bind(this))},Object.defineProperty(t.Transport.prototype,"state",{get:function(){return this._clock.getStateAtTime(this.now())}}),t.Transport.prototype.start=function(e,i){return t.isDefined(i)&&(i=this.toTicks(i)),this._clock.start(e,i),this},t.Transport.prototype.stop=function(t){return this._clock.stop(t),this},t.Transport.prototype.pause=function(t){return this._clock.pause(t),this},t.Transport.prototype.toggle=function(e){return e=this.toSeconds(e),this._clock.getStateAtTime(e)!==t.State.Started?this.start(e):this.stop(e),this},Object.defineProperty(t.Transport.prototype,"timeSignature",{get:function(){return this._timeSignature},set:function(e){t.isArray(e)&&(e=e[0]/e[1]*4),this._timeSignature=e}}),Object.defineProperty(t.Transport.prototype,"loopStart",{get:function(){return t.Ticks(this._loopStart).toSeconds()},set:function(t){this._loopStart=this.toTicks(t)}}),Object.defineProperty(t.Transport.prototype,"loopEnd",{get:function(){return t.Ticks(this._loopEnd).toSeconds()},set:function(t){this._loopEnd=this.toTicks(t)}}),t.Transport.prototype.setLoopPoints=function(t,e){return this.loopStart=t,this.loopEnd=e,this},Object.defineProperty(t.Transport.prototype,"swing",{get:function(){return this._swingAmount},set:function(t){this._swingAmount=t}}),Object.defineProperty(t.Transport.prototype,"swingSubdivision",{get:function(){return t.Ticks(this._swingTicks).toNotation()},set:function(t){this._swingTicks=this.toTicks(t)}}),Object.defineProperty(t.Transport.prototype,"position",{get:function(){var e=this.now(),i=this._clock.getTicksAtTime(e);return t.Ticks(i).toBarsBeatsSixteenths()},set:function(t){var e=this.toTicks(t);this.ticks=e}}),Object.defineProperty(t.Transport.prototype,"seconds",{get:function(){return this._clock.seconds},set:function(t){var e=this.now(),i=this.bpm.timeToTicks(t,e);this.ticks=i}}),Object.defineProperty(t.Transport.prototype,"progress",{get:function(){if(this.loop){var t=this.now();return(this._clock.getTicksAtTime(t)-this._loopStart)/(this._loopEnd-this._loopStart)}return 0}}),Object.defineProperty(t.Transport.prototype,"ticks",{get:function(){return this._clock.ticks},set:function(e){if(this._clock.ticks!==e){var i=this.now();this.state===t.State.Started?(this.emit("stop",i),this._clock.setTicksAtTime(e,i),this.emit("start",i,this.seconds)):this._clock.setTicksAtTime(e,i)}}}),t.Transport.prototype.getTicksAtTime=function(t){return Math.round(this._clock.getTicksAtTime(t))},t.Transport.prototype.getSecondsAtTime=function(t){return this._clock.getSecondsAtTime(t)},Object.defineProperty(t.Transport.prototype,"PPQ",{get:function(){return this._ppq},set:function(t){var e=this.bpm.value;this._ppq=t,this.bpm.value=e}}),t.Transport.prototype._fromUnits=function(t){return 1/(60/t/this.PPQ)},t.Transport.prototype._toUnits=function(t){return t/this.PPQ*60},t.Transport.prototype.nextSubdivision=function(e){if(e=this.toTicks(e),this.state!==t.State.Started)return 0;var i=this.now(),n=e-this.getTicksAtTime(i)%e;return this._clock.nextTickTime(n,i)},t.Transport.prototype.syncSignal=function(e,i){if(!i){var n=this.now();i=0!==e.getValueAtTime(n)?e.getValueAtTime(n)/this.bpm.getValueAtTime(n):0}var o=new t.Gain(i);return this.bpm.chain(o,e._param),this._syncedSignals.push({ratio:o,signal:e,initial:e.value}),e.value=0,this},t.Transport.prototype.unsyncSignal=function(t){for(var e=this._syncedSignals.length-1;e>=0;e--){var i=this._syncedSignals[e];i.signal===t&&(i.ratio.dispose(),i.signal.value=i.initial,this._syncedSignals.splice(e,1))}return this},t.Transport.prototype.dispose=function(){return t.Emitter.prototype.dispose.call(this),this._clock.dispose(),this._clock=null,this._writable("bpm"),this.bpm=null,this._timeline.dispose(),this._timeline=null,this._repeatedEvents.dispose(),this._repeatedEvents=null,this};var e=t.Transport;return t.Transport=new e,t.Context.on("init",function(i){i.transport&&i.transport.isTransport?t.Transport=i.transport:t.Transport=new e}),t.Context.on("close",function(t){t.transport&&t.transport.isTransport&&t.transport.dispose()}),t.Transport}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(1),i(6),i(16),i(82)],void 0===(o=function(t){"use strict";return t.Oscillator=function(){var e=t.defaults(arguments,["frequency","type"],t.Oscillator);t.Source.call(this,e),this._oscillator=null,this.frequency=new t.Signal(e.frequency,t.Type.Frequency),this.detune=new t.Signal(e.detune,t.Type.Cents),this._wave=null,this._partials=e.partials,this._partialCount=e.partialCount,this._phase=e.phase,this._type=e.type,e.partialCount&&e.type!==t.Oscillator.Type.Custom&&(this._type=this.baseType+e.partialCount.toString()),this.phase=this._phase,this._readOnly(["frequency","detune"])},t.extend(t.Oscillator,t.Source),t.Oscillator.defaults={type:"sine",frequency:440,detune:0,phase:0,partials:[],partialCount:0},t.Oscillator.Type={Sine:"sine",Triangle:"triangle",Sawtooth:"sawtooth",Square:"square",Custom:"custom"},t.Oscillator.prototype._start=function(e){this.log("start",e),this._oscillator=new t.OscillatorNode,this._wave?this._oscillator.setPeriodicWave(this._wave):this._oscillator.type=this._type,this._oscillator.connect(this.output),this.frequency.connect(this._oscillator.frequency),this.detune.connect(this._oscillator.detune),e=this.toSeconds(e),this._oscillator.start(e)},t.Oscillator.prototype._stop=function(t){return this.log("stop",t),this._oscillator&&(t=this.toSeconds(t),this._oscillator.stop(t)),this},t.Oscillator.prototype.restart=function(t){return this._oscillator&&this._oscillator.cancelStop(),this._state.cancel(this.toSeconds(t)),this},t.Oscillator.prototype.syncFrequency=function(){return t.Transport.syncSignal(this.frequency),this},t.Oscillator.prototype.unsyncFrequency=function(){return t.Transport.unsyncSignal(this.frequency),this},Object.defineProperty(t.Oscillator.prototype,"type",{get:function(){return this._type},set:function(t){var e=this._getRealImaginary(t,this._phase),i=this.context.createPeriodicWave(e[0],e[1]);this._wave=i,null!==this._oscillator&&this._oscillator.setPeriodicWave(this._wave),this._type=t}}),Object.defineProperty(t.Oscillator.prototype,"baseType",{get:function(){return this._type.replace(this.partialCount,"")},set:function(e){this.partialCount&&this._type!==t.Oscillator.Type.Custom&&e!==t.Oscillator.Type.Custom?this.type=e+this.partialCount:this.type=e}}),Object.defineProperty(t.Oscillator.prototype,"partialCount",{get:function(){return this._partialCount},set:function(e){var i=this._type,n=/^(sine|triangle|square|sawtooth)(\d+)$/.exec(this._type);n&&(i=n[1]),this._type!==t.Oscillator.Type.Custom&&(this.type=0===e?i:i+e.toString())}}),t.Oscillator.prototype.get=function(){const e=t.prototype.get.apply(this,arguments);return e.type!==t.Oscillator.Type.Custom&&delete e.partials,e},t.Oscillator.prototype._getRealImaginary=function(e,i){var n=2048,o=new Float32Array(n),s=new Float32Array(n),r=1;if(e===t.Oscillator.Type.Custom)r=this._partials.length+1,this._partialCount=this._partials.length,n=r;else{var a=/^(sine|triangle|square|sawtooth)(\d+)$/.exec(e);a?(r=parseInt(a[2])+1,this._partialCount=parseInt(a[2]),e=a[1],n=r=Math.max(r,2)):this._partialCount=0,this._partials=[]}for(var l=1;l<n;++l){var h,u=2/(l*Math.PI);switch(e){case t.Oscillator.Type.Sine:h=l<=r?1:0,this._partials[l-1]=h;break;case t.Oscillator.Type.Square:h=1&l?2*u:0,this._partials[l-1]=h;break;case t.Oscillator.Type.Sawtooth:h=u*(1&l?1:-1),this._partials[l-1]=h;break;case t.Oscillator.Type.Triangle:h=1&l?u*u*2*(l-1>>1&1?-1:1):0,this._partials[l-1]=h;break;case t.Oscillator.Type.Custom:h=this._partials[l-1];break;default:throw new TypeError("Tone.Oscillator: invalid type: "+e)}0!==h?(o[l]=-h*Math.sin(i*l),s[l]=h*Math.cos(i*l)):(o[l]=0,s[l]=0)}return[o,s]},t.Oscillator.prototype._inverseFFT=function(t,e,i){for(var n=0,o=t.length,s=0;s<o;s++)n+=t[s]*Math.cos(s*i)+e[s]*Math.sin(s*i);return n},t.Oscillator.prototype._getInitialValue=function(){for(var t=this._getRealImaginary(this._type,0),e=t[0],i=t[1],n=0,o=2*Math.PI,s=0;s<8;s++)n=Math.max(this._inverseFFT(e,i,s/8*o),n);return-this._inverseFFT(e,i,this._phase)/n},Object.defineProperty(t.Oscillator.prototype,"partials",{get:function(){return this._partials},set:function(e){this._partials=e,this.type=t.Oscillator.Type.Custom}}),Object.defineProperty(t.Oscillator.prototype,"phase",{get:function(){return this._phase*(180/Math.PI)},set:function(t){this._phase=t*Math.PI/180,this.type=this._type}}),t.Oscillator.prototype.dispose=function(){return t.Source.prototype.dispose.call(this),null!==this._oscillator&&(this._oscillator.dispose(),this._oscillator=null),this._wave=null,this._writable(["frequency","detune"]),this.frequency.dispose(),this.frequency=null,this.detune.dispose(),this.detune=null,this._partials=null,this},t.Oscillator}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(14),i(2)],void 0===(o=function(t){"use strict";return t.Delay=function(){var e=t.defaults(arguments,["delayTime","maxDelay"],t.Delay);t.AudioNode.call(this,e),this._maxDelay=Math.max(this.toSeconds(e.maxDelay),this.toSeconds(e.delayTime)),this._delayNode=this.input=this.output=this.context.createDelay(this._maxDelay),this.delayTime=new t.Param({param:this._delayNode.delayTime,units:t.Type.Time,value:e.delayTime}),this._readOnly("delayTime")},t.extend(t.Delay,t.AudioNode),t.Delay.defaults={maxDelay:1,delayTime:0},Object.defineProperty(t.Delay.prototype,"maxDelay",{get:function(){return this._maxDelay}}),t.Delay.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._delayNode.disconnect(),this._delayNode=null,this._writable("delayTime"),this.delayTime=null,this},t.Delay}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(3),i(2)],void 0===(o=function(t){"use strict";return t.Split=function(){t.AudioNode.call(this),this.createInsOuts(0,2),this._splitter=this.input=this.context.createChannelSplitter(2),this.left=this.output[0]=new t.Gain,this.right=this.output[1]=new t.Gain,this._splitter.connect(this.left,0,0),this._splitter.connect(this.right,1,0)},t.extend(t.Split,t.AudioNode),t.Split.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._splitter.disconnect(),this.left.dispose(),this.left=null,this.right.dispose(),this.right=null,this._splitter=null,this},t.Split}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(35),i(24),i(34)],void 0===(o=function(t){t.Context=function(){t.Emitter.call(this);var i=t.defaults(arguments,["context"],t.Context);if(!i.context&&(i.context=new t.global.AudioContext,!i.context))throw new Error("could not create AudioContext. Possibly too many AudioContexts running already.");for(this._context=i.context;this._context.rawContext;)this._context=this._context.rawContext;for(var n in this._context)this._defineProperty(this._context,n);this._latencyHint=i.latencyHint,this._constants={},this.lookAhead=i.lookAhead,this._computedUpdateInterval=0,this._ticker=new e(this.emit.bind(this,"tick"),i.clockSource,i.updateInterval),this._timeouts=new t.Timeline,this._timeoutIds=0,this.on("tick",this._timeoutLoop.bind(this)),this._context.onstatechange=function(t){this.emit("statechange",t)}.bind(this)},t.extend(t.Context,t.Emitter),t.Emitter.mixin(t.Context),t.Context.defaults={clockSource:"worker",latencyHint:"interactive",lookAhead:.1,updateInterval:.03},t.Context.prototype.isContext=!0,t.Context.prototype._defineProperty=function(e,i){t.isUndef(this[i])&&Object.defineProperty(this,i,{get:function(){return"function"==typeof e[i]?e[i].bind(e):e[i]},set:function(t){e[i]=t}})},t.Context.prototype.now=function(){return this._context.currentTime+this.lookAhead},Object.defineProperty(t.Context.prototype,"destination",{get:function(){return this.master?this.master:this._context.destination}}),t.Context.prototype.resume=function(){return"suspended"===this._context.state&&this._context instanceof AudioContext?this._context.resume():Promise.resolve()},t.Context.prototype.close=function(){var e=Promise.resolve();return this!==t.global.TONE_AUDIO_CONTEXT&&(e=this.rawContext.close()),e.then(function(){t.Context.emit("close",this)}.bind(this))},t.Context.prototype.getConstant=function(t){if(this._constants[t])return this._constants[t];for(var e=this._context.createBuffer(1,128,this._context.sampleRate),i=e.getChannelData(0),n=0;n<i.length;n++)i[n]=t;var o=this._context.createBufferSource();return o.channelCount=1,o.channelCountMode="explicit",o.buffer=e,o.loop=!0,o.start(0),this._constants[t]=o,o},t.Context.prototype._timeoutLoop=function(){for(var t=this.now();this._timeouts&&this._timeouts.length&&this._timeouts.peek().time<=t;)this._timeouts.shift().callback()},t.Context.prototype.setTimeout=function(t,e){this._timeoutIds++;var i=this.now();return this._timeouts.add({callback:t,time:i+e,id:this._timeoutIds}),this._timeoutIds},t.Context.prototype.clearTimeout=function(t){return this._timeouts.forEach(function(e){e.id===t&&this.remove(e)}),this},Object.defineProperty(t.Context.prototype,"updateInterval",{get:function(){return this._ticker.updateInterval},set:function(t){this._ticker.updateInterval=t}}),Object.defineProperty(t.Context.prototype,"rawContext",{get:function(){return this._context}}),Object.defineProperty(t.Context.prototype,"clockSource",{get:function(){return this._ticker.type},set:function(t){this._ticker.type=t}}),Object.defineProperty(t.Context.prototype,"latencyHint",{get:function(){return this._latencyHint},set:function(e){var i=e;if(this._latencyHint=e,t.isString(e))switch(e){case"interactive":i=.1,this._context.latencyHint=e;break;case"playback":i=.8,this._context.latencyHint=e;break;case"balanced":i=.25,this._context.latencyHint=e;break;case"fastest":this._context.latencyHint="interactive",i=.01}this.lookAhead=i,this.updateInterval=i/3}}),t.Context.prototype.dispose=function(){return this.close().then(function(){for(var e in t.Emitter.prototype.dispose.call(this),this._ticker.dispose(),this._ticker=null,this._timeouts.dispose(),this._timeouts=null,this._constants)this._constants[e].disconnect();this._constants=null}.bind(this))};var e=function(e,i,n){this._type=i,this._updateInterval=n,this._callback=t.defaultArg(e,t.noOp),this._createClock()};if(e.Type={Worker:"worker",Timeout:"timeout",Offline:"offline"},e.prototype._createWorker=function(){t.global.URL=t.global.URL||t.global.webkitURL;var e=new Blob(["var timeoutTime = "+(1e3*this._updateInterval).toFixed(1)+";self.onmessage = function(msg){\ttimeoutTime = parseInt(msg.data);};function tick(){\tsetTimeout(tick, timeoutTime);\tself.postMessage('tick');}tick();"]),i=URL.createObjectURL(e),n=new Worker(i);n.onmessage=this._callback.bind(this),this._worker=n},e.prototype._createTimeout=function(){this._timeout=setTimeout(function(){this._createTimeout(),this._callback()}.bind(this),1e3*this._updateInterval)},e.prototype._createClock=function(){if(this._type===e.Type.Worker)try{this._createWorker()}catch(t){this._type=e.Type.Timeout,this._createClock()}else this._type===e.Type.Timeout&&this._createTimeout()},Object.defineProperty(e.prototype,"updateInterval",{get:function(){return this._updateInterval},set:function(t){this._updateInterval=Math.max(t,128/44100),this._type===e.Type.Worker&&this._worker.postMessage(Math.max(1e3*t,1))}}),Object.defineProperty(e.prototype,"type",{get:function(){return this._type},set:function(t){this._disposeClock(),this._type=t,this._createClock()}}),e.prototype._disposeClock=function(){this._timeout&&(clearTimeout(this._timeout),this._timeout=null),this._worker&&(this._worker.terminate(),this._worker.onmessage=null,this._worker=null)},e.prototype.dispose=function(){this._disposeClock(),this._callback=null},t.getContext(function(){var e=AudioNode.prototype.connect,i=AudioNode.prototype.disconnect;function n(i,n,o){if(i.input)return o=t.defaultArg(o,0),t.isArray(i.input)?this.connect(i.input[o]):this.connect(i.input,n,o);try{return i instanceof AudioNode?(e.call(this,i,n,o),i):(e.call(this,i,n),i)}catch(t){throw new Error("error connecting to node: "+i+"\n"+t)}}AudioNode.prototype.connect!==n&&(AudioNode.prototype.connect=n,AudioNode.prototype.disconnect=function(e,n,o){if(e&&e.input&&t.isArray(e.input))o=t.defaultArg(o,0),this.disconnect(e.input[o],n,0);else if(e&&e.input)this.disconnect(e.input,n,o);else try{e instanceof AudioParam?i.call(this,e,n):i.apply(this,arguments)}catch(t){throw new Error("error disconnecting node: "+e+"\n"+t)}})}),t.supported&&!t.initialized){if(t.global.TONE_AUDIO_CONTEXT||(t.global.TONE_AUDIO_CONTEXT=new t.Context),t.context=t.global.TONE_AUDIO_CONTEXT,!t.global.TONE_SILENCE_VERSION_LOGGING){var i="v";"dev"===t.version&&(i="");var n=" * Tone.js "+i+t.version+" * ";console.log("%c"+n,"background: #000; color: #fff")}}else t.supported||console.warn("This browser does not support Tone.js");return t.Context}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(4),i(40)],void 0===(o=function(t){"use strict";return t.Instrument=function(e){e=t.defaultArg(e,t.Instrument.defaults),t.AudioNode.call(this),this._volume=this.output=new t.Volume(e.volume),this.volume=this._volume.volume,this._readOnly("volume"),this._scheduledEvents=[]},t.extend(t.Instrument,t.AudioNode),t.Instrument.defaults={volume:0},t.Instrument.prototype.triggerAttack=t.noOp,t.Instrument.prototype.triggerRelease=t.noOp,t.Instrument.prototype.sync=function(){return this._syncMethod("triggerAttack",1),this._syncMethod("triggerRelease",0),this},t.Instrument.prototype._syncMethod=function(e,i){var n=this["_original_"+e]=this[e];this[e]=function(){var e=Array.prototype.slice.call(arguments),o=e[i],s=t.Transport.schedule(function(t){e[i]=t,n.apply(this,e)}.bind(this),o);this._scheduledEvents.push(s)}.bind(this)},t.Instrument.prototype.unsync=function(){return this._scheduledEvents.forEach(function(e){t.Transport.clear(e)}),this._scheduledEvents=[],this._original_triggerAttack&&(this.triggerAttack=this._original_triggerAttack,this.triggerRelease=this._original_triggerRelease),this},t.Instrument.prototype.triggerAttackRelease=function(t,e,i,n){return i=this.toSeconds(i),e=this.toSeconds(e),this.triggerAttack(t,i,n),this.triggerRelease(i+e),this},t.Instrument.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._volume.dispose(),this._volume=null,this._writable(["volume"]),this.volume=null,this.unsync(),this._scheduledEvents=null,this},t.Instrument}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(7),i(1)],void 0===(o=function(t){"use strict";return t.AudioToGain=function(){t.SignalBase.call(this),this._norm=this.input=this.output=new t.WaveShaper(function(t){return(t+1)/2})},t.extend(t.AudioToGain,t.SignalBase),t.AudioToGain.prototype.dispose=function(){return t.SignalBase.prototype.dispose.call(this),this._norm.dispose(),this._norm=null,this},t.AudioToGain}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(1),i(13),i(93),i(3),i(2)],void 0===(o=function(t){"use strict";return t.CrossFade=function(e){t.AudioNode.call(this),this.createInsOuts(2,1),this.a=this.input[0]=new t.Gain,this.b=this.input[1]=new t.Gain,this.fade=new t.Signal(t.defaultArg(e,.5),t.Type.NormalRange),this._equalPowerA=new t.EqualPowerGain,this._equalPowerB=new t.EqualPowerGain,this._one=this.context.getConstant(1),this._invert=new t.Subtract,this.a.connect(this.output),this.b.connect(this.output),this.fade.chain(this._equalPowerB,this.b.gain),this._one.connect(this._invert,0,0),this.fade.connect(this._invert,0,1),this._invert.chain(this._equalPowerA,this.a.gain),this._readOnly("fade")},t.extend(t.CrossFade,t.AudioNode),t.CrossFade.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._writable("fade"),this._equalPowerA.dispose(),this._equalPowerA=null,this._equalPowerB.dispose(),this._equalPowerB=null,this.fade.dispose(),this.fade=null,this._invert.dispose(),this._invert=null,this._one=null,this.a.dispose(),this.a=null,this.b.dispose(),this.b=null,this},t.CrossFade}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0)],void 0===(o=function(t){"use strict";return t.Timeline=function(){var e=t.defaults(arguments,["memory"],t.Timeline);t.call(this),this._timeline=[],this.memory=e.memory},t.extend(t.Timeline),t.Timeline.defaults={memory:1/0},Object.defineProperty(t.Timeline.prototype,"length",{get:function(){return this._timeline.length}}),t.Timeline.prototype.add=function(e){if(t.isUndef(e.time))throw new Error("Tone.Timeline: events must have a time attribute");e.time=e.time.valueOf();var i=this._search(e.time);if(this._timeline.splice(i+1,0,e),this.length>this.memory){var n=this.length-this.memory;this._timeline.splice(0,n)}return this},t.Timeline.prototype.remove=function(t){var e=this._timeline.indexOf(t);return-1!==e&&this._timeline.splice(e,1),this},t.Timeline.prototype.get=function(e,i){i=t.defaultArg(i,"time");var n=this._search(e,i);return-1!==n?this._timeline[n]:null},t.Timeline.prototype.peek=function(){return this._timeline[0]},t.Timeline.prototype.shift=function(){return this._timeline.shift()},t.Timeline.prototype.getAfter=function(e,i){i=t.defaultArg(i,"time");var n=this._search(e,i);return n+1<this._timeline.length?this._timeline[n+1]:null},t.Timeline.prototype.getBefore=function(e,i){i=t.defaultArg(i,"time");var n=this._timeline.length;if(n>0&&this._timeline[n-1][i]<e)return this._timeline[n-1];var o=this._search(e,i);return o-1>=0?this._timeline[o-1]:null},t.Timeline.prototype.cancel=function(t){if(this._timeline.length>1){var e=this._search(t);if(e>=0)if(this._timeline[e].time===t){for(var i=e;i>=0&&this._timeline[i].time===t;i--)e=i;this._timeline=this._timeline.slice(0,e)}else this._timeline=this._timeline.slice(0,e+1);else this._timeline=[]}else 1===this._timeline.length&&this._timeline[0].time>=t&&(this._timeline=[]);return this},t.Timeline.prototype.cancelBefore=function(t){var e=this._search(t);return e>=0&&(this._timeline=this._timeline.slice(e+1)),this},t.Timeline.prototype.previousEvent=function(t){var e=this._timeline.indexOf(t);return e>0?this._timeline[e-1]:null},t.Timeline.prototype._search=function(e,i){if(0===this._timeline.length)return-1;i=t.defaultArg(i,"time");var n=0,o=this._timeline.length,s=o;if(o>0&&this._timeline[o-1][i]<=e)return o-1;for(;n<s;){var r=Math.floor(n+(s-n)/2),a=this._timeline[r],l=this._timeline[r+1];if(a[i]===e){for(var h=r;h<this._timeline.length;h++){this._timeline[h][i]===e&&(r=h)}return r}if(a[i]<e&&l[i]>e)return r;a[i]>e?s=r:n=r+1}return-1},t.Timeline.prototype._iterate=function(e,i,n){i=t.defaultArg(i,0),n=t.defaultArg(n,this._timeline.length-1),this._timeline.slice(i,n+1).forEach(function(t){e.call(this,t)}.bind(this))},t.Timeline.prototype.forEach=function(t){return this._iterate(t),this},t.Timeline.prototype.forEachBefore=function(t,e){var i=this._search(t);return-1!==i&&this._iterate(e,0,i),this},t.Timeline.prototype.forEachAfter=function(t,e){var i=this._search(t);return this._iterate(e,i+1),this},t.Timeline.prototype.forEachBetween=function(t,e,i){var n=this._search(t),o=this._search(e);return-1!==n&&-1!==o?(this._timeline[n].time!==t&&(n+=1),this._timeline[o].time===e&&(o-=1),this._iterate(i,n,o)):-1===n&&this._iterate(i,0,o),this},t.Timeline.prototype.forEachFrom=function(t,e){for(var i=this._search(t);i>=0&&this._timeline[i].time>=t;)i--;return this._iterate(e,i+1),this},t.Timeline.prototype.forEachAtTime=function(t,e){var i=this._search(t);return-1!==i&&this._iterate(function(i){i.time===t&&e.call(this,i)},0,i),this},t.Timeline.prototype.dispose=function(){return t.prototype.dispose.call(this),this._timeline=null,this},t.Timeline}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(21),i(1)],void 0===(o=function(t){"use strict";return t.Monophonic=function(e){e=t.defaultArg(e,t.Monophonic.defaults),t.Instrument.call(this,e),this.portamento=e.portamento},t.extend(t.Monophonic,t.Instrument),t.Monophonic.defaults={portamento:0},t.Monophonic.prototype.triggerAttack=function(t,e,i){return this.log("triggerAttack",t,e,i),e=this.toSeconds(e),this._triggerEnvelopeAttack(e,i),this.setNote(t,e),this},t.Monophonic.prototype.triggerRelease=function(t){return this.log("triggerRelease",t),t=this.toSeconds(t),this._triggerEnvelopeRelease(t),this},t.Monophonic.prototype._triggerEnvelopeAttack=function(){},t.Monophonic.prototype._triggerEnvelopeRelease=function(){},t.Monophonic.prototype.getLevelAtTime=function(t){return t=this.toSeconds(t),this.envelope.getValueAtTime(t)},t.Monophonic.prototype.setNote=function(t,e){if(e=this.toSeconds(e),this.portamento>0&&this.getLevelAtTime(e)>.05){var i=this.toSeconds(this.portamento);this.frequency.exponentialRampTo(t,i,e)}else this.frequency.setValueAtTime(t,e);return this},t.Monophonic}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(29),i(5),i(1)],void 0===(o=function(t){"use strict";return t.Scale=function(e,i){t.SignalBase.call(this),this._outputMin=t.defaultArg(e,0),this._outputMax=t.defaultArg(i,1),this._scale=this.input=new t.Multiply(1),this._add=this.output=new t.Add(0),this._scale.connect(this._add),this._setRange()},t.extend(t.Scale,t.SignalBase),Object.defineProperty(t.Scale.prototype,"min",{get:function(){return this._outputMin},set:function(t){this._outputMin=t,this._setRange()}}),Object.defineProperty(t.Scale.prototype,"max",{get:function(){return this._outputMax},set:function(t){this._outputMax=t,this._setRange()}}),t.Scale.prototype._setRange=function(){this._add.value=this._outputMin,this._scale.value=this._outputMax-this._outputMin},t.Scale.prototype.dispose=function(){return t.SignalBase.prototype.dispose.call(this),this._add.dispose(),this._add=null,this._scale.dispose(),this._scale=null,this},t.Scale}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(1),i(3),i(2)],void 0===(o=function(t){"use strict";return t.Volume=function(){var e=t.defaults(arguments,["volume"],t.Volume);t.AudioNode.call(this,e),this.output=this.input=new t.Gain(e.volume,t.Type.Decibels),this._unmutedVolume=e.volume,this.volume=this.output.gain,this._readOnly("volume"),this.mute=e.mute},t.extend(t.Volume,t.AudioNode),t.Volume.defaults={volume:0,mute:!1},Object.defineProperty(t.Volume.prototype,"mute",{get:function(){return this.volume.value===-1/0},set:function(t){!this.mute&&t?(this._unmutedVolume=this.volume.value,this.volume.value=-1/0):this.mute&&!t&&(this.volume.value=this._unmutedVolume)}}),t.Volume.prototype.dispose=function(){return this.input.dispose(),t.AudioNode.prototype.dispose.call(this),this._writable("volume"),this.volume.dispose(),this.volume=null,this},t.Volume}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(3),i(36)],void 0===(o=function(t){return t.Zero=function(){t.SignalBase.call(this),this._gain=this.input=this.output=new t.Gain,this.context.getConstant(0).connect(this._gain)},t.extend(t.Zero,t.SignalBase),t.Zero.prototype.dispose=function(){return t.SignalBase.prototype.dispose.call(this),this._gain.dispose(),this._gain=null,this},t.Zero}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(1),i(3)],void 0===(o=function(t){"use strict";return t.Add=function(e){t.Signal.call(this),this.createInsOuts(2,0),this._sum=this.input[0]=this.input[1]=this.output=new t.Gain,this._param=this.input[1]=new t.Signal(e),this._param.connect(this._sum),this.proxy=!1},t.extend(t.Add,t.Signal),t.Add.prototype.dispose=function(){return t.Signal.prototype.dispose.call(this),this._sum.dispose(),this._sum=null,this},t.Add}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(47),i(3)],void 0===(o=function(t){"use strict";return t.AmplitudeEnvelope=function(){t.Envelope.apply(this,arguments),this.input=this.output=new t.Gain,this._sig.connect(this.output.gain)},t.extend(t.AmplitudeEnvelope,t.Envelope),t.AmplitudeEnvelope.prototype.dispose=function(){return t.Envelope.prototype.dispose.call(this),this},t.AmplitudeEnvelope}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(11),i(6),i(3),i(2),i(63)],void 0===(o=function(t){return t.BufferSource=function(){var e=t.defaults(arguments,["buffer","onload"],t.BufferSource);t.AudioNode.call(this,e),this.onended=e.onended,this._startTime=-1,this._sourceStarted=!1,this._sourceStopped=!1,this._stopTime=-1,this._gainNode=this.output=new t.Gain(0),this._source=this.context.createBufferSource(),this._source.connect(this._gainNode),this._source.onended=this._onended.bind(this),this._buffer=new t.Buffer(e.buffer,e.onload),this.playbackRate=new t.Param({param:this._source.playbackRate,units:t.Type.Positive,value:e.playbackRate}),this.fadeIn=e.fadeIn,this.fadeOut=e.fadeOut,this.curve=e.curve,this._onendedTimeout=-1,this.loop=e.loop,this.loopStart=e.loopStart,this.loopEnd=e.loopEnd},t.extend(t.BufferSource,t.AudioNode),t.BufferSource.defaults={onended:t.noOp,onload:t.noOp,loop:!1,loopStart:0,loopEnd:0,fadeIn:0,fadeOut:0,curve:"linear",playbackRate:1},Object.defineProperty(t.BufferSource.prototype,"state",{get:function(){return this.getStateAtTime(this.now())}}),t.BufferSource.prototype.getStateAtTime=function(e){return e=this.toSeconds(e),-1!==this._startTime&&this._startTime<=e&&(-1===this._stopTime||e<this._stopTime)&&!this._sourceStopped?t.State.Started:t.State.Stopped},t.BufferSource.prototype.start=function(e,i,n,o){this.log("start",e,i,n,o),this.assert(-1===this._startTime,"can only be started once"),this.assert(this.buffer.loaded,"buffer is either not set or not loaded"),this.assert(!this._sourceStopped,"source is already stopped"),e=this.toSeconds(e),i=this.loop?t.defaultArg(i,this.loopStart):t.defaultArg(i,0),i=this.toSeconds(i),i=Math.max(i,0),o=t.defaultArg(o,1);var s=this.toSeconds(this.fadeIn);if(s>0?(this._gainNode.gain.setValueAtTime(0,e),"linear"===this.curve?this._gainNode.gain.linearRampToValueAtTime(o,e+s):this._gainNode.gain.exponentialApproachValueAtTime(o,e,s)):this._gainNode.gain.setValueAtTime(o,e),this._startTime=e,t.isDefined(n)){var r=this.toSeconds(n);r=Math.max(r,0),this.stop(e+r)}if(this.loop){var a=this.loopEnd||this.buffer.duration,l=this.loopStart;i>=a&&(i=(i-l)%(a-l)+l)}return this._source.buffer=this.buffer.get(),this._source.loopEnd=this.loopEnd||this.buffer.duration,i<this.buffer.duration&&(this._sourceStarted=!0,this._source.start(e,i)),this},t.BufferSource.prototype.stop=function(e){this.log("stop",e),this.assert(this.buffer.loaded,"buffer is either not set or not loaded"),this.assert(!this._sourceStopped,"source is already stopped"),e=this.toSeconds(e),-1!==this._stopTime&&this.cancelStop();var i=this.toSeconds(this.fadeOut);return this._stopTime=e+i,i>0?"linear"===this.curve?this._gainNode.gain.linearRampTo(0,i,e):this._gainNode.gain.targetRampTo(0,i,e):(this._gainNode.gain.cancelAndHoldAtTime(e),this._gainNode.gain.setValueAtTime(0,e)),t.context.clearTimeout(this._onendedTimeout),this._onendedTimeout=t.context.setTimeout(this._onended.bind(this),this._stopTime-this.now()),this},t.BufferSource.prototype.cancelStop=function(){if(-1!==this._startTime&&!this._sourceStopped){var t=this.toSeconds(this.fadeIn);this._gainNode.gain.cancelScheduledValues(this._startTime+t+this.sampleTime),this.context.clearTimeout(this._onendedTimeout),this._stopTime=-1}return this},t.BufferSource.prototype._onended=function(){if(!this._sourceStopped){this._sourceStopped=!0;var t="exponential"===this.curve?2*this.fadeOut:0;this._sourceStarted&&-1!==this._stopTime&&this._source.stop(this._stopTime+t),this.onended(this)}},Object.defineProperty(t.BufferSource.prototype,"loopStart",{get:function(){return this._source.loopStart},set:function(t){this._source.loopStart=this.toSeconds(t)}}),Object.defineProperty(t.BufferSource.prototype,"loopEnd",{get:function(){return this._source.loopEnd},set:function(t){this._source.loopEnd=this.toSeconds(t)}}),Object.defineProperty(t.BufferSource.prototype,"buffer",{get:function(){return this._buffer},set:function(t){this._buffer.set(t)}}),Object.defineProperty(t.BufferSource.prototype,"loop",{get:function(){return this._source.loop},set:function(t){this._source.loop=t,this.cancelStop()}}),t.BufferSource.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this.onended=null,this._source.onended=null,this._source.disconnect(),this._source=null,this._gainNode.dispose(),this._gainNode=null,this._buffer.dispose(),this._buffer=null,this._startTime=-1,this.playbackRate=null,t.context.clearTimeout(this._onendedTimeout),this},t.BufferSource}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(8),i(1),i(5),i(3)],void 0===(o=function(t){"use strict";return t.FeedbackEffect=function(){var e=t.defaults(arguments,["feedback"],t.FeedbackEffect);t.Effect.call(this,e),this._feedbackGain=new t.Gain(e.feedback,t.Type.NormalRange),this.feedback=this._feedbackGain.gain,this.effectReturn.chain(this._feedbackGain,this.effectSend),this._readOnly(["feedback"])},t.extend(t.FeedbackEffect,t.Effect),t.FeedbackEffect.defaults={feedback:.125},t.FeedbackEffect.prototype.dispose=function(){return t.Effect.prototype.dispose.call(this),this._writable(["feedback"]),this._feedbackGain.dispose(),this._feedbackGain=null,this.feedback=null,this},t.FeedbackEffect}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(24),i(4)],void 0===(o=function(t){"use strict";return t.TimelineState=function(e){t.Timeline.call(this),this._initial=e},t.extend(t.TimelineState,t.Timeline),t.TimelineState.prototype.getValueAtTime=function(t){var e=this.get(t);return null!==e?e.state:this._initial},t.TimelineState.prototype.setStateAtTime=function(t,e){return this.add({state:t,time:e}),this},t.TimelineState.prototype.getLastState=function(t,e){e=this.toSeconds(e);for(var i=this._search(e);i>=0;i--){var n=this._timeline[i];if(n.state===t)return n}},t.TimelineState.prototype.getNextState=function(t,e){e=this.toSeconds(e);var i=this._search(e);if(-1!==i)for(var n=i;n<this._timeline.length;n++){var o=this._timeline[n];if(o.state===t)return o}},t.TimelineState}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(66)],void 0===(o=function(t){if(t.supported){!t.global.hasOwnProperty("AudioContext")&&t.global.hasOwnProperty("webkitAudioContext")&&(t.global.AudioContext=t.global.webkitAudioContext),AudioContext.prototype.close||(AudioContext.prototype.close=function(){return t.isFunction(this.suspend)&&this.suspend(),Promise.resolve()}),AudioContext.prototype.resume||(AudioContext.prototype.resume=function(){var t=this.createBuffer(1,1,this.sampleRate),e=this.createBufferSource();return e.buffer=t,e.connect(this.destination),e.start(0),Promise.resolve()}),!AudioContext.prototype.createGain&&AudioContext.prototype.createGainNode&&(AudioContext.prototype.createGain=AudioContext.prototype.createGainNode),!AudioContext.prototype.createDelay&&AudioContext.prototype.createDelayNode&&(AudioContext.prototype.createDelay=AudioContext.prototype.createDelayNode);var e=!1,i=new OfflineAudioContext(1,1,44100),n=new Uint32Array([1179011410,48,1163280727,544501094,16,131073,44100,176400,1048580,1635017060,8,0,0,0,0]).buffer;try{var o=i.decodeAudioData(n);o&&t.isFunction(o.then)&&(e=!0)}catch(t){e=!1}e||(AudioContext.prototype._native_decodeAudioData=AudioContext.prototype.decodeAudioData,AudioContext.prototype.decodeAudioData=function(t){return new Promise(function(e,i){this._native_decodeAudioData(t,e,i)}.bind(this))})}}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0)],void 0===(o=function(t){"use strict";return t.Emitter=function(){t.call(this),this._events={}},t.extend(t.Emitter),t.Emitter.prototype.on=function(t,e){for(var i=t.split(/\W+/),n=0;n<i.length;n++){var o=i[n];this._events.hasOwnProperty(o)||(this._events[o]=[]),this._events[o].push(e)}return this},t.Emitter.prototype.once=function(t,e){var i=function(){e.apply(this,arguments),this.off(t,i)}.bind(this);return this.on(t,i),this},t.Emitter.prototype.off=function(e,i){for(var n=e.split(/\W+/),o=0;o<n.length;o++)if(e=n[o],this._events.hasOwnProperty(e))if(t.isUndef(i))this._events[e]=[];else for(var s=this._events[e],r=0;r<s.length;r++)s[r]===i&&s.splice(r,1);return this},t.Emitter.prototype.emit=function(t){if(this._events){var e=Array.apply(null,arguments).slice(1);if(this._events.hasOwnProperty(t))for(var i=this._events[t].slice(0),n=0,o=i.length;n<o;n++)i[n].apply(this,e)}return this},t.Emitter.mixin=function(e){var i=["on","once","off","emit"];e._events={};for(var n=0;n<i.length;n++){var o=i[n],s=t.Emitter.prototype[o];e[o]=s}return t.Emitter},t.Emitter.prototype.dispose=function(){return t.prototype.dispose.call(this),this._events=null,this},t.Emitter}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(2)],void 0===(o=function(t){"use strict";return t.SignalBase=function(){t.AudioNode.call(this)},t.extend(t.SignalBase,t.AudioNode),t.SignalBase.prototype.connect=function(e,i,n){return t.Signal&&t.Signal===e.constructor||t.Param&&t.Param===e.constructor?(e._param.cancelScheduledValues(0),e._param.setValueAtTime(0,0),e.overridden=!0):e instanceof AudioParam&&(e.cancelScheduledValues(0),e.setValueAtTime(0,0)),t.AudioNode.prototype.connect.call(this,e,i,n),this},t.SignalBase}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(6),i(17),i(49),i(71),i(48),i(70),i(69)],void 0===(o=function(t){"use strict";t.OmniOscillator=function(){var e=t.defaults(arguments,["frequency","type"],t.OmniOscillator);t.Source.call(this,e),this.frequency=new t.Signal(e.frequency,t.Type.Frequency),this.detune=new t.Signal(e.detune,t.Type.Cents),this._sourceType=void 0,this._oscillator=null,this.type=e.type,this._readOnly(["frequency","detune"]),this.set(e)},t.extend(t.OmniOscillator,t.Source),t.OmniOscillator.defaults={frequency:440,detune:0,type:"sine",phase:0};var e="PulseOscillator",i="PWMOscillator",n="Oscillator",o="FMOscillator",s="AMOscillator",r="FatOscillator";t.OmniOscillator.prototype._start=function(t){this._oscillator.start(t)},t.OmniOscillator.prototype._stop=function(t){this._oscillator.stop(t)},t.OmniOscillator.prototype.restart=function(t){this._oscillator.restart(t)},Object.defineProperty(t.OmniOscillator.prototype,"type",{get:function(){var t="";return this._sourceType===o?t="fm":this._sourceType===s?t="am":this._sourceType===r&&(t="fat"),t+this._oscillator.type},set:function(t){"fm"===t.substr(0,2)?(this._createNewOscillator(o),this._oscillator.type=t.substr(2)):"am"===t.substr(0,2)?(this._createNewOscillator(s),this._oscillator.type=t.substr(2)):"fat"===t.substr(0,3)?(this._createNewOscillator(r),this._oscillator.type=t.substr(3)):"pwm"===t?this._createNewOscillator(i):"pulse"===t?this._createNewOscillator(e):(this._createNewOscillator(n),this._oscillator.type=t)}}),Object.defineProperty(t.OmniOscillator.prototype,"partials",{get:function(){return this._oscillator.partials},set:function(t){this._oscillator.partials=t}}),Object.defineProperty(t.OmniOscillator.prototype,"partialCount",{get:function(){return this._oscillator.partialCount},set:function(t){this._oscillator.partialCount=t}}),t.OmniOscillator.prototype.set=function(e,i){return"type"===e?this.type=i:t.isObject(e)&&e.hasOwnProperty("type")&&(this.type=e.type),t.prototype.set.apply(this,arguments),this},t.OmniOscillator.prototype.get=function(t){var e=this._oscillator.get(t);return e.type=this.type,e},t.OmniOscillator.prototype._createNewOscillator=function(e){if(e!==this._sourceType){this._sourceType=e;var i=t[e],n=this.now();if(null!==this._oscillator){var o=this._oscillator;o.stop(n),this.context.setTimeout(function(){o.dispose(),o=null},this.blockTime)}this._oscillator=new i,this.frequency.connect(this._oscillator.frequency),this.detune.connect(this._oscillator.detune),this._oscillator.connect(this.output),this.state===t.State.Started&&this._oscillator.start(n)}},Object.defineProperty(t.OmniOscillator.prototype,"phase",{get:function(){return this._oscillator.phase},set:function(t){this._oscillator.phase=t}});var a={PulseOscillator:"pulse",PWMOscillator:"pwm",Oscillator:"oscillator",FMOscillator:"fm",AMOscillator:"am",FatOscillator:"fat"};return Object.defineProperty(t.OmniOscillator.prototype,"sourceType",{get:function(){return a[this._sourceType]},set:function(t){var e="sine";"pwm"!==this._oscillator.type&&"pulse"!==this._oscillator.type&&(e=this._oscillator.type),t===a.FMOscillator?this.type="fm"+e:t===a.AMOscillator?this.type="am"+e:t===a.FatOscillator?this.type="fat"+e:t===a.Oscillator?this.type=e:t===a.PulseOscillator?this.type="pulse":t===a.PWMOscillator&&(this.type="pwm")}}),Object.defineProperty(t.OmniOscillator.prototype,"baseType",{get:function(){return this._oscillator.baseType},set:function(t){this.sourceType!==a.PulseOscillator&&this.sourceType!==a.PWMOscillator&&(this._oscillator.baseType=t)}}),Object.defineProperty(t.OmniOscillator.prototype,"width",{get:function(){if(this._sourceType===e)return this._oscillator.width}}),Object.defineProperty(t.OmniOscillator.prototype,"count",{get:function(){if(this._sourceType===r)return this._oscillator.count},set:function(t){this._sourceType===r&&(this._oscillator.count=t)}}),Object.defineProperty(t.OmniOscillator.prototype,"spread",{get:function(){if(this._sourceType===r)return this._oscillator.spread},set:function(t){this._sourceType===r&&(this._oscillator.spread=t)}}),Object.defineProperty(t.OmniOscillator.prototype,"modulationType",{get:function(){if(this._sourceType===o||this._sourceType===s)return this._oscillator.modulationType},set:function(t){this._sourceType!==o&&this._sourceType!==s||(this._oscillator.modulationType=t)}}),Object.defineProperty(t.OmniOscillator.prototype,"modulationIndex",{get:function(){if(this._sourceType===o)return this._oscillator.modulationIndex}}),Object.defineProperty(t.OmniOscillator.prototype,"harmonicity",{get:function(){if(this._sourceType===o||this._sourceType===s)return this._oscillator.harmonicity}}),Object.defineProperty(t.OmniOscillator.prototype,"modulationFrequency",{get:function(){if(this._sourceType===i)return this._oscillator.modulationFrequency}}),t.OmniOscillator.prototype.dispose=function(){return t.Source.prototype.dispose.call(this),this._writable(["frequency","detune"]),this.detune.dispose(),this.detune=null,this.frequency.dispose(),this.frequency=null,this._oscillator.dispose(),this._oscillator=null,this._sourceType=null,this},t.OmniOscillator}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(30),i(37),i(1),i(25)],void 0===(o=function(t){"use strict";return t.Synth=function(e){e=t.defaultArg(e,t.Synth.defaults),t.Monophonic.call(this,e),this.oscillator=new t.OmniOscillator(e.oscillator),this.frequency=this.oscillator.frequency,this.detune=this.oscillator.detune,this.envelope=new t.AmplitudeEnvelope(e.envelope),this.oscillator.chain(this.envelope,this.output),this._readOnly(["oscillator","frequency","detune","envelope"])},t.extend(t.Synth,t.Monophonic),t.Synth.defaults={oscillator:{type:"triangle"},envelope:{attack:.005,decay:.1,sustain:.3,release:1}},t.Synth.prototype._triggerEnvelopeAttack=function(t,e){return this.envelope.triggerAttack(t,e),this.oscillator.start(t),0===this.envelope.sustain&&this.oscillator.stop(t+this.envelope.attack+this.envelope.decay),this},t.Synth.prototype._triggerEnvelopeRelease=function(t){return t=this.toSeconds(t),this.envelope.triggerRelease(t),this.oscillator.stop(t+this.envelope.release),this},t.Synth.prototype.dispose=function(){return t.Monophonic.prototype.dispose.call(this),this._writable(["oscillator","frequency","detune","envelope"]),this.oscillator.dispose(),this.oscillator=null,this.envelope.dispose(),this.envelope=null,this.frequency=null,this.detune=null,this},t.Synth}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(6),i(11),i(31)],void 0===(o=function(t){"use strict";t.Noise=function(){var e=t.defaults(arguments,["type"],t.Noise);t.Source.call(this,e),this._source=null,this._type=e.type,this._playbackRate=e.playbackRate},t.extend(t.Noise,t.Source),t.Noise.defaults={type:"white",playbackRate:1},Object.defineProperty(t.Noise.prototype,"type",{get:function(){return this._type},set:function(i){if(this._type!==i){if(!(i in e))throw new TypeError("Tone.Noise: invalid type: "+i);if(this._type=i,this.state===t.State.Started){var n=this.now();this._stop(n),this._start(n)}}}}),Object.defineProperty(t.Noise.prototype,"playbackRate",{get:function(){return this._playbackRate},set:function(t){this._playbackRate=t,this._source&&(this._source.playbackRate.value=t)}}),t.Noise.prototype._start=function(i){var n=e[this._type];this._source=new t.BufferSource(n).connect(this.output),this._source.loop=!0,this._source.playbackRate.value=this._playbackRate,this._source.start(this.toSeconds(i),Math.random()*(n.duration-.001))},t.Noise.prototype._stop=function(t){this._source&&(this._source.stop(this.toSeconds(t)),this._source=null)},t.Noise.prototype.restart=function(t){return this._stop(t),this._start(t),this},t.Noise.prototype.dispose=function(){return t.Source.prototype.dispose.call(this),null!==this._source&&(this._source.disconnect(),this._source=null),this._buffer=null,this};var e={},i={};return Object.defineProperty(e,"pink",{get:function(){if(!i.pink){for(var e=[],n=0;n<2;n++){var o,s,r,a,l,h,u,c=new Float32Array(220500);e[n]=c,o=s=r=a=l=h=u=0;for(var p=0;p<220500;p++){var f=2*Math.random()-1;o=.99886*o+.0555179*f,s=.99332*s+.0750759*f,r=.969*r+.153852*f,a=.8665*a+.3104856*f,l=.55*l+.5329522*f,h=-.7616*h-.016898*f,c[p]=o+s+r+a+l+h+u+.5362*f,c[p]*=.11,u=.115926*f}}i.pink=(new t.Buffer).fromArray(e)}return i.pink}}),Object.defineProperty(e,"brown",{get:function(){if(!i.brown){for(var e=[],n=0;n<2;n++){var o=new Float32Array(220500);e[n]=o;for(var s=0,r=0;r<220500;r++){var a=2*Math.random()-1;o[r]=(s+.02*a)/1.02,s=o[r],o[r]*=3.5}}i.brown=(new t.Buffer).fromArray(e)}return i.brown}}),Object.defineProperty(e,"white",{get:function(){if(!i.white){for(var e=[],n=0;n<2;n++){var o=new Float32Array(220500);e[n]=o;for(var s=0;s<220500;s++)o[s]=2*Math.random()-1}i.white=(new t.Buffer).fromArray(e)}return i.white}}),t.Noise}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(27),i(20),i(2)],void 0===(o=function(t){"use strict";t.Master=function(){t.AudioNode.call(this),t.getContext(function(){this.createInsOuts(1,0),this._volume=this.output=new t.Volume,this.volume=this._volume.volume,this._readOnly("volume"),this.input.chain(this.output,this.context.destination),this.context.master=this}.bind(this))},t.extend(t.Master,t.AudioNode),t.Master.defaults={volume:0,mute:!1},t.Master.prototype.isMaster=!0,Object.defineProperty(t.Master.prototype,"mute",{get:function(){return this._volume.mute},set:function(t){this._volume.mute=t}}),t.Master.prototype.chain=function(){this.input.disconnect(),this.input.chain.apply(this.input,arguments),arguments[arguments.length-1].connect(this.output)},t.Master.prototype.dispose=function(){t.AudioNode.prototype.dispose.call(this),this._writable("volume"),this._volume.dispose(),this._volume=null,this.volume=null},t.AudioNode.prototype.toMaster=function(){return this.connect(this.context.master),this};var e=t.Master;return t.Master=new e,t.Context.on("init",function(i){i.master&&i.master.isMaster?t.Master=i.master:t.Master=new e}),t.Context.on("close",function(t){t.master&&t.master.isMaster&&t.master.dispose()}),t.Master}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(89),i(47)],void 0===(o=function(t){"use strict";return t.FrequencyEnvelope=function(){var e=t.defaults(arguments,["attack","decay","sustain","release"],t.Envelope);e=t.defaultArg(e,t.FrequencyEnvelope.defaults),t.ScaledEnvelope.call(this,e),this._octaves=e.octaves,this.baseFrequency=e.baseFrequency,this.octaves=e.octaves,this.exponent=e.exponent},t.extend(t.FrequencyEnvelope,t.Envelope),t.FrequencyEnvelope.defaults={baseFrequency:200,octaves:4,exponent:1},Object.defineProperty(t.FrequencyEnvelope.prototype,"baseFrequency",{get:function(){return this._scale.min},set:function(t){this._scale.min=this.toFrequency(t),this.octaves=this._octaves}}),Object.defineProperty(t.FrequencyEnvelope.prototype,"octaves",{get:function(){return this._octaves},set:function(t){this._octaves=t,this._scale.max=this.baseFrequency*Math.pow(2,t)}}),Object.defineProperty(t.FrequencyEnvelope.prototype,"exponent",{get:function(){return this._exp.value},set:function(t){this._exp.value=t}}),t.FrequencyEnvelope.prototype.dispose=function(){return t.ScaledEnvelope.prototype.dispose.call(this),this},t.FrequencyEnvelope}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(26),i(61)],void 0===(o=function(t){return t.ScaleExp=function(e,i,n){t.SignalBase.call(this),this._scale=this.output=new t.Scale(e,i),this._exp=this.input=new t.Pow(t.defaultArg(n,2)),this._exp.connect(this._scale)},t.extend(t.ScaleExp,t.SignalBase),Object.defineProperty(t.ScaleExp.prototype,"exponent",{get:function(){return this._exp.value},set:function(t){this._exp.value=t}}),Object.defineProperty(t.ScaleExp.prototype,"min",{get:function(){return this._scale.min},set:function(t){this._scale.min=t}}),Object.defineProperty(t.ScaleExp.prototype,"max",{get:function(){return this._scale.max},set:function(t){this._scale.max=t}}),t.ScaleExp.prototype.dispose=function(){return t.SignalBase.prototype.dispose.call(this),this._scale.dispose(),this._scale=null,this._exp.dispose(),this._exp=null,this},t.ScaleExp}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(14),i(2)],void 0===(o=function(t){"use strict";return t.Compressor=function(){var e=t.defaults(arguments,["threshold","ratio"],t.Compressor);t.AudioNode.call(this),this._compressor=this.input=this.output=this.context.createDynamicsCompressor(),this.threshold=new t.Param({param:this._compressor.threshold,units:t.Type.Decibels,convert:!1}),this.attack=new t.Param(this._compressor.attack,t.Type.Time),this.release=new t.Param(this._compressor.release,t.Type.Time),this.knee=new t.Param({param:this._compressor.knee,units:t.Type.Decibels,convert:!1}),this.ratio=new t.Param({param:this._compressor.ratio,convert:!1}),this._readOnly(["knee","release","attack","ratio","threshold"]),this.set(e)},t.extend(t.Compressor,t.AudioNode),t.Compressor.defaults={ratio:12,threshold:-24,release:.25,attack:.003,knee:30},t.Compressor.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._writable(["knee","release","attack","ratio","threshold"]),this._compressor.disconnect(),this._compressor=null,this.attack.dispose(),this.attack=null,this.release.dispose(),this.release=null,this.threshold.dispose(),this.threshold=null,this.ratio.dispose(),this.ratio=null,this.knee.dispose(),this.knee=null,this},t.Compressor}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(2),i(96)],void 0===(o=function(t){"use strict";return t.Analyser=function(){var e=t.defaults(arguments,["type","size"],t.Analyser);t.AudioNode.call(this),this._analyser=this.input=this.output=this.context.createAnalyser(),this._type=e.type,this._buffer=null,this.size=e.size,this.type=e.type},t.extend(t.Analyser,t.AudioNode),t.Analyser.defaults={size:1024,type:"fft",smoothing:.8},t.Analyser.Type={Waveform:"waveform",FFT:"fft"},t.Analyser.prototype.getValue=function(){return this._type===t.Analyser.Type.FFT?this._analyser.getFloatFrequencyData(this._buffer):this._type===t.Analyser.Type.Waveform&&this._analyser.getFloatTimeDomainData(this._buffer),this._buffer},Object.defineProperty(t.Analyser.prototype,"size",{get:function(){return this._analyser.frequencyBinCount},set:function(t){this._analyser.fftSize=2*t,this._buffer=new Float32Array(t)}}),Object.defineProperty(t.Analyser.prototype,"type",{get:function(){return this._type},set:function(e){if(e!==t.Analyser.Type.Waveform&&e!==t.Analyser.Type.FFT)throw new TypeError("Tone.Analyser: invalid type: "+e);this._type=e}}),Object.defineProperty(t.Analyser.prototype,"smoothing",{get:function(){return this._analyser.smoothingTimeConstant},set:function(t){this._analyser.smoothingTimeConstant=t}}),t.Analyser.prototype.dispose=function(){t.AudioNode.prototype.dispose.call(this),this._analyser.disconnect(),this._analyser=null,this._buffer=null},t.Analyser}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(65)],void 0===(o=function(t){return t.TransportTime=function(e,i){if(!(this instanceof t.TransportTime))return new t.TransportTime(e,i);t.Time.call(this,e,i)},t.extend(t.TransportTime,t.Time),t.TransportTime.prototype._now=function(){return t.Transport.seconds},t.TransportTime}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(64)],void 0===(o=function(t){t.Frequency=function(e,i){if(!(this instanceof t.Frequency))return new t.Frequency(e,i);t.TimeBase.call(this,e,i)},t.extend(t.Frequency,t.TimeBase),t.Frequency.prototype._expressions=Object.assign({},t.TimeBase.prototype._expressions,{midi:{regexp:/^(\d+(?:\.\d+)?midi)/,method:function(e){return"midi"===this._defaultUnits?e:t.Frequency.mtof(e)}},note:{regexp:/^([a-g]{1}(?:b|#|x|bb)?)(-?[0-9]+)/i,method:function(i,n){var o=e[i.toLowerCase()]+12*(parseInt(n)+1);return"midi"===this._defaultUnits?o:t.Frequency.mtof(o)}},tr:{regexp:/^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?):?(\d+(?:\.\d+)?)?/,method:function(t,e,i){var n=1;return t&&"0"!==t&&(n*=this._beatsToUnits(this._getTimeSignature()*parseFloat(t))),e&&"0"!==e&&(n*=this._beatsToUnits(parseFloat(e))),i&&"0"!==i&&(n*=this._beatsToUnits(parseFloat(i)/4)),n}}}),t.Frequency.prototype.transpose=function(e){return new this.constructor(this.valueOf()*t.intervalToFrequencyRatio(e))},t.Frequency.prototype.harmonize=function(t){return t.map(function(t){return this.transpose(t)}.bind(this))},t.Frequency.prototype.toMidi=function(){return t.Frequency.ftom(this.valueOf())},t.Frequency.prototype.toNote=function(){var e=this.toFrequency(),n=Math.log2(e/t.Frequency.A4),o=Math.round(12*n)+57,s=Math.floor(o/12);return s<0&&(o+=-12*s),i[o%12]+s.toString()},t.Frequency.prototype.toSeconds=function(){return 1/t.TimeBase.prototype.toSeconds.call(this)},t.Frequency.prototype.toFrequency=function(){return t.TimeBase.prototype.toFrequency.call(this)},t.Frequency.prototype.toTicks=function(){var e=this._beatsToUnits(1),i=this.valueOf()/e;return Math.floor(i*t.Transport.PPQ)},t.Frequency.prototype._noArg=function(){return 0},t.Frequency.prototype._frequencyToUnits=function(t){return t},t.Frequency.prototype._ticksToUnits=function(e){return 1/(60*e/(t.Transport.bpm.value*t.Transport.PPQ))},t.Frequency.prototype._beatsToUnits=function(e){return 1/t.TimeBase.prototype._beatsToUnits.call(this,e)},t.Frequency.prototype._secondsToUnits=function(t){return 1/t},t.Frequency.prototype._defaultUnits="hz";var e={cbb:-2,cb:-1,c:0,"c#":1,cx:2,dbb:0,db:1,d:2,"d#":3,dx:4,ebb:2,eb:3,e:4,"e#":5,ex:6,fbb:3,fb:4,f:5,"f#":6,fx:7,gbb:5,gb:6,g:7,"g#":8,gx:9,abb:7,ab:8,a:9,"a#":10,ax:11,bbb:9,bb:10,b:11,"b#":12,bx:13},i=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];return t.Frequency.A4=440,t.Frequency.mtof=function(e){return t.Frequency.A4*Math.pow(2,(e-69)/12)},t.Frequency.ftom=function(e){return 69+Math.round(12*Math.log2(e/t.Frequency.A4))},t.Frequency}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(1),i(61),i(4),i(2)],void 0===(o=function(t){"use strict";return t.Envelope=function(){var e=t.defaults(arguments,["attack","decay","sustain","release"],t.Envelope);t.AudioNode.call(this),this.attack=e.attack,this.decay=e.decay,this.sustain=e.sustain,this.release=e.release,this._attackCurve="linear",this._releaseCurve="exponential",this._sig=this.output=new t.Signal(0),this.attackCurve=e.attackCurve,this.releaseCurve=e.releaseCurve,this.decayCurve=e.decayCurve},t.extend(t.Envelope,t.AudioNode),t.Envelope.defaults={attack:.01,decay:.1,sustain:.5,release:1,attackCurve:"linear",decayCurve:"exponential",releaseCurve:"exponential"},Object.defineProperty(t.Envelope.prototype,"value",{get:function(){return this.getValueAtTime(this.now())}}),t.Envelope.prototype._getCurve=function(e,i){if(t.isString(e))return e;if(t.isArray(e)){for(var n in t.Envelope.Type)if(t.Envelope.Type[n][i]===e)return n;return e}},t.Envelope.prototype._setCurve=function(e,i,n){if(t.Envelope.Type.hasOwnProperty(n)){var o=t.Envelope.Type[n];t.isObject(o)?this[e]=o[i]:this[e]=o}else{if(!t.isArray(n))throw new Error("Tone.Envelope: invalid curve: "+n);this[e]=n}},Object.defineProperty(t.Envelope.prototype,"attackCurve",{get:function(){return this._getCurve(this._attackCurve,"In")},set:function(t){this._setCurve("_attackCurve","In",t)}}),Object.defineProperty(t.Envelope.prototype,"releaseCurve",{get:function(){return this._getCurve(this._releaseCurve,"Out")},set:function(t){this._setCurve("_releaseCurve","Out",t)}}),Object.defineProperty(t.Envelope.prototype,"decayCurve",{get:function(){return this._decayCurve},set:function(t){if(!["linear","exponential"].includes(t))throw new Error("Tone.Envelope: invalid curve: "+t);this._decayCurve=t}}),t.Envelope.prototype.triggerAttack=function(e,i){this.log("triggerAttack",e,i),e=this.toSeconds(e);var n=this.toSeconds(this.attack),o=this.toSeconds(this.decay);i=t.defaultArg(i,1);var s=this.getValueAtTime(e);s>0&&(n=(1-s)/(1/n));if("linear"===this._attackCurve)this._sig.linearRampTo(i,n,e);else if("exponential"===this._attackCurve)this._sig.targetRampTo(i,n,e);else if(n>0){this._sig.cancelAndHoldAtTime(e);for(var r=this._attackCurve,a=1;a<r.length;a++)if(r[a-1]<=s&&s<=r[a]){(r=this._attackCurve.slice(a))[0]=s;break}this._sig.setValueCurveAtTime(r,e,n,i)}if(o){var l=i*this.sustain,h=e+n;this.log("decay",h),"linear"===this._decayCurve?this._sig.linearRampTo(l,o,h+this.sampleTime):"exponential"===this._decayCurve&&this._sig.exponentialApproachValueAtTime(l,h,o)}return this},t.Envelope.prototype.triggerRelease=function(e){this.log("triggerRelease",e),e=this.toSeconds(e);var i=this.getValueAtTime(e);if(i>0){var n=this.toSeconds(this.release);if("linear"===this._releaseCurve)this._sig.linearRampTo(0,n,e);else if("exponential"===this._releaseCurve)this._sig.targetRampTo(0,n,e);else{var o=this._releaseCurve;t.isArray(o)&&(this._sig.cancelAndHoldAtTime(e),this._sig.setValueCurveAtTime(o,e,n,i))}}return this},t.Envelope.prototype.getValueAtTime=function(t){return this._sig.getValueAtTime(t)},t.Envelope.prototype.triggerAttackRelease=function(t,e,i){return e=this.toSeconds(e),this.triggerAttack(e,i),this.triggerRelease(e+this.toSeconds(t)),this},t.Envelope.prototype.cancel=function(t){return this._sig.cancelScheduledValues(t),this},t.Envelope.prototype.connect=t.SignalBase.prototype.connect,function(){var e,i,n=[];for(e=0;e<128;e++)n[e]=Math.sin(e/127*(Math.PI/2));var o=[];for(e=0;e<127;e++){i=e/127;var s=Math.sin(i*(2*Math.PI)*6.4-Math.PI/2)+1;o[e]=s/10+.83*i}o[127]=1;var r=[];for(e=0;e<128;e++)r[e]=Math.ceil(e/127*5)/5;var a=[];for(e=0;e<128;e++)i=e/127,a[e]=.5*(1-Math.cos(Math.PI*i));var l,h=[];for(e=0;e<128;e++){i=e/127;var u=4*Math.pow(i,3)+.2,c=Math.cos(u*Math.PI*2*i);h[e]=Math.abs(c*(1-i))}function p(t){for(var e=new Array(t.length),i=0;i<t.length;i++)e[i]=1-t[i];return e}t.Envelope.Type={linear:"linear",exponential:"exponential",bounce:{In:p(h),Out:h},cosine:{In:n,Out:(l=n,l.slice(0).reverse())},step:{In:r,Out:p(r)},ripple:{In:o,Out:p(o)},sine:{In:a,Out:p(a)}}}(),t.Envelope.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._sig.dispose(),this._sig=null,this._attackCurve=null,this._releaseCurve=null,this},t.Envelope}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(6),i(17),i(5),i(3)],void 0===(o=function(t){"use strict";return t.FMOscillator=function(){var e=t.defaults(arguments,["frequency","type","modulationType"],t.FMOscillator);t.Source.call(this,e),this._carrier=new t.Oscillator(e.frequency,e.type),this.frequency=new t.Signal(e.frequency,t.Type.Frequency),this.detune=this._carrier.detune,this.detune.value=e.detune,this.modulationIndex=new t.Multiply(e.modulationIndex),this.modulationIndex.units=t.Type.Positive,this._modulator=new t.Oscillator(e.frequency,e.modulationType),this.harmonicity=new t.Multiply(e.harmonicity),this.harmonicity.units=t.Type.Positive,this._modulationNode=new t.Gain(0),this.frequency.connect(this._carrier.frequency),this.frequency.chain(this.harmonicity,this._modulator.frequency),this.frequency.chain(this.modulationIndex,this._modulationNode),this._modulator.connect(this._modulationNode.gain),this._modulationNode.connect(this._carrier.frequency),this._carrier.connect(this.output),this.detune.connect(this._modulator.detune),this.phase=e.phase,this._readOnly(["modulationIndex","frequency","detune","harmonicity"])},t.extend(t.FMOscillator,t.Source),t.FMOscillator.defaults={frequency:440,detune:0,phase:0,type:"sine",modulationIndex:2,modulationType:"square",harmonicity:1},t.FMOscillator.prototype._start=function(t){this._modulator.start(t),this._carrier.start(t)},t.FMOscillator.prototype._stop=function(t){this._modulator.stop(t),this._carrier.stop(t)},t.FMOscillator.prototype.restart=function(t){this._modulator.restart(t),this._carrier.restart(t)},Object.defineProperty(t.FMOscillator.prototype,"type",{get:function(){return this._carrier.type},set:function(t){this._carrier.type=t}}),Object.defineProperty(t.FMOscillator.prototype,"baseType",{get:function(){return this._carrier.baseType},set:function(t){this._carrier.baseType=t}}),Object.defineProperty(t.FMOscillator.prototype,"partialCount",{get:function(){return this._carrier.partialCount},set:function(t){this._carrier.partialCount=t}}),Object.defineProperty(t.FMOscillator.prototype,"modulationType",{get:function(){return this._modulator.type},set:function(t){this._modulator.type=t}}),Object.defineProperty(t.FMOscillator.prototype,"phase",{get:function(){return this._carrier.phase},set:function(t){this._carrier.phase=t,this._modulator.phase=t}}),Object.defineProperty(t.FMOscillator.prototype,"partials",{get:function(){return this._carrier.partials},set:function(t){this._carrier.partials=t}}),t.FMOscillator.prototype.dispose=function(){return t.Source.prototype.dispose.call(this),this._writable(["modulationIndex","frequency","detune","harmonicity"]),this.frequency.dispose(),this.frequency=null,this.detune=null,this.harmonicity.dispose(),this.harmonicity=null,this._carrier.dispose(),this._carrier=null,this._modulator.dispose(),this._modulator=null,this._modulationNode.dispose(),this._modulationNode=null,this.modulationIndex.dispose(),this.modulationIndex=null,this},t.FMOscillator}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(6),i(17),i(1),i(7),i(3)],void 0===(o=function(t){"use strict";return t.PulseOscillator=function(){var e=t.defaults(arguments,["frequency","width"],t.Oscillator);t.Source.call(this,e),this.width=new t.Signal(e.width,t.Type.NormalRange),this._widthGate=new t.Gain(0),this._sawtooth=new t.Oscillator({frequency:e.frequency,detune:e.detune,type:"sawtooth",phase:e.phase}),this.frequency=this._sawtooth.frequency,this.detune=this._sawtooth.detune,this._thresh=new t.WaveShaper(function(t){return t<0?-1:1}),this._sawtooth.chain(this._thresh,this.output),this.width.chain(this._widthGate,this._thresh),this._readOnly(["width","frequency","detune"])},t.extend(t.PulseOscillator,t.Source),t.PulseOscillator.defaults={frequency:440,detune:0,phase:0,width:.2},t.PulseOscillator.prototype._start=function(t){t=this.toSeconds(t),this._sawtooth.start(t),this._widthGate.gain.setValueAtTime(1,t)},t.PulseOscillator.prototype._stop=function(t){t=this.toSeconds(t),this._sawtooth.stop(t),this._widthGate.gain.setValueAtTime(0,t)},t.PulseOscillator.prototype.restart=function(t){this._sawtooth.restart(t),this._widthGate.gain.cancelScheduledValues(t),this._widthGate.gain.setValueAtTime(1,t)},Object.defineProperty(t.PulseOscillator.prototype,"phase",{get:function(){return this._sawtooth.phase},set:function(t){this._sawtooth.phase=t}}),Object.defineProperty(t.PulseOscillator.prototype,"type",{get:function(){return"pulse"}}),Object.defineProperty(t.PulseOscillator.prototype,"baseType",{get:function(){return"pulse"}}),Object.defineProperty(t.PulseOscillator.prototype,"partials",{get:function(){return[]}}),t.PulseOscillator.prototype.dispose=function(){return t.Source.prototype.dispose.call(this),this._sawtooth.dispose(),this._sawtooth=null,this._writable(["width","frequency","detune"]),this.width.dispose(),this.width=null,this._widthGate.dispose(),this._widthGate=null,this._thresh.dispose(),this._thresh=null,this.frequency=null,this.detune=null,this},t.PulseOscillator}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(16),i(4),i(33)],void 0===(o=function(t){"use strict";return t.Event=function(){var e=t.defaults(arguments,["callback","value"],t.Event);t.call(this),this._loop=e.loop,this.callback=e.callback,this.value=e.value,this._loopStart=this.toTicks(e.loopStart),this._loopEnd=this.toTicks(e.loopEnd),this._state=new t.TimelineState(t.State.Stopped),this._playbackRate=1,this._startOffset=0,this._probability=e.probability,this._humanize=e.humanize,this.mute=e.mute,this.playbackRate=e.playbackRate},t.extend(t.Event),t.Event.defaults={callback:t.noOp,loop:!1,loopEnd:"1m",loopStart:0,playbackRate:1,value:null,probability:1,mute:!1,humanize:!1},t.Event.prototype._rescheduleEvents=function(e){return e=t.defaultArg(e,-1),this._state.forEachFrom(e,function(e){var i;if(e.state===t.State.Started){t.isDefined(e.id)&&t.Transport.clear(e.id);var n=e.time+Math.round(this.startOffset/this._playbackRate);if(this._loop){i=1/0,t.isNumber(this._loop)&&(i=this._loop*this._getLoopDuration());var o=this._state.getAfter(n);null!==o&&(i=Math.min(i,o.time-n)),i!==1/0&&(this._state.setStateAtTime(t.State.Stopped,n+i+1),i=t.Ticks(i));var s=t.Ticks(this._getLoopDuration());e.id=t.Transport.scheduleRepeat(this._tick.bind(this),s,t.Ticks(n),i)}else e.id=t.Transport.schedule(this._tick.bind(this),t.Ticks(n))}}.bind(this)),this},Object.defineProperty(t.Event.prototype,"state",{get:function(){return this._state.getValueAtTime(t.Transport.ticks)}}),Object.defineProperty(t.Event.prototype,"startOffset",{get:function(){return this._startOffset},set:function(t){this._startOffset=t}}),Object.defineProperty(t.Event.prototype,"probability",{get:function(){return this._probability},set:function(t){this._probability=t}}),Object.defineProperty(t.Event.prototype,"humanize",{get:function(){return this._humanize},set:function(t){this._humanize=t}}),t.Event.prototype.start=function(e){return e=this.toTicks(e),this._state.getValueAtTime(e)===t.State.Stopped&&(this._state.add({state:t.State.Started,time:e,id:void 0}),this._rescheduleEvents(e)),this},t.Event.prototype.stop=function(e){if(this.cancel(e),e=this.toTicks(e),this._state.getValueAtTime(e)===t.State.Started){this._state.setStateAtTime(t.State.Stopped,e);var i=this._state.getBefore(e),n=e;null!==i&&(n=i.time),this._rescheduleEvents(n)}return this},t.Event.prototype.cancel=function(e){return e=t.defaultArg(e,-1/0),e=this.toTicks(e),this._state.forEachFrom(e,function(e){t.Transport.clear(e.id)}),this._state.cancel(e),this},t.Event.prototype._tick=function(e){var i=t.Transport.getTicksAtTime(e);if(!this.mute&&this._state.getValueAtTime(i)===t.State.Started){if(this.probability<1&&Math.random()>this.probability)return;if(this.humanize){var n=.02;t.isBoolean(this.humanize)||(n=this.toSeconds(this.humanize)),e+=(2*Math.random()-1)*n}this.callback(e,this.value)}},t.Event.prototype._getLoopDuration=function(){return Math.round((this._loopEnd-this._loopStart)/this._playbackRate)},Object.defineProperty(t.Event.prototype,"loop",{get:function(){return this._loop},set:function(t){this._loop=t,this._rescheduleEvents()}}),Object.defineProperty(t.Event.prototype,"playbackRate",{get:function(){return this._playbackRate},set:function(t){this._playbackRate=t,this._rescheduleEvents()}}),Object.defineProperty(t.Event.prototype,"loopEnd",{get:function(){return t.Ticks(this._loopEnd).toSeconds()},set:function(t){this._loopEnd=this.toTicks(t),this._loop&&this._rescheduleEvents()}}),Object.defineProperty(t.Event.prototype,"loopStart",{get:function(){return t.Ticks(this._loopStart).toSeconds()},set:function(t){this._loopStart=this.toTicks(t),this._loop&&this._rescheduleEvents()}}),Object.defineProperty(t.Event.prototype,"progress",{get:function(){if(this._loop){var e=t.Transport.ticks,i=this._state.get(e);if(null!==i&&i.state===t.State.Started){var n=this._getLoopDuration();return(e-i.time)%n/n}return 0}return 0}}),t.Event.prototype.dispose=function(){this.cancel(),this._state.dispose(),this._state=null,this.callback=null,this.value=null},t.Event}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(1),i(13),i(29),i(10),i(3),i(2)],void 0===(o=function(t){"use strict";return t.MidSideMerge=function(){t.AudioNode.call(this),this.createInsOuts(2,0),this.mid=this.input[0]=new t.Gain,this._left=new t.Add,this._timesTwoLeft=new t.Multiply(Math.SQRT1_2),this.side=this.input[1]=new t.Gain,this._right=new t.Subtract,this._timesTwoRight=new t.Multiply(Math.SQRT1_2),this._merge=this.output=new t.Merge,this.mid.connect(this._left,0,0),this.side.connect(this._left,0,1),this.mid.connect(this._right,0,0),this.side.connect(this._right,0,1),this._left.connect(this._timesTwoLeft),this._right.connect(this._timesTwoRight),this._timesTwoLeft.connect(this._merge,0,0),this._timesTwoRight.connect(this._merge,0,1)},t.extend(t.MidSideMerge,t.AudioNode),t.MidSideMerge.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this.mid.dispose(),this.mid=null,this.side.dispose(),this.side=null,this._left.dispose(),this._left=null,this._timesTwoLeft.dispose(),this._timesTwoLeft=null,this._right.dispose(),this._right=null,this._timesTwoRight.dispose(),this._timesTwoRight=null,this._merge.dispose(),this._merge=null,this},t.MidSideMerge}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(29),i(13),i(1),i(19),i(2)],void 0===(o=function(t){"use strict";return t.MidSideSplit=function(){t.AudioNode.call(this),this.createInsOuts(0,2),this._split=this.input=new t.Split,this._midAdd=new t.Add,this.mid=this.output[0]=new t.Multiply(Math.SQRT1_2),this._sideSubtract=new t.Subtract,this.side=this.output[1]=new t.Multiply(Math.SQRT1_2),this._split.connect(this._midAdd,0,0),this._split.connect(this._midAdd,1,1),this._split.connect(this._sideSubtract,0,0),this._split.connect(this._sideSubtract,1,1),this._midAdd.connect(this.mid),this._sideSubtract.connect(this.side)},t.extend(t.MidSideSplit,t.AudioNode),t.MidSideSplit.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this.mid.dispose(),this.mid=null,this.side.dispose(),this.side=null,this._midAdd.dispose(),this._midAdd=null,this._sideSubtract.dispose(),this._sideSubtract=null,this._split.dispose(),this._split=null,this},t.MidSideSplit}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(1),i(9),i(2),i(58)],void 0===(o=function(t){"use strict";return t.LowpassCombFilter=function(){var e=t.defaults(arguments,["delayTime","resonance","dampening"],t.LowpassCombFilter);t.AudioNode.call(this),this._combFilter=this.output=new t.FeedbackCombFilter(e.delayTime,e.resonance),this.delayTime=this._combFilter.delayTime,this._lowpass=this.input=new t.Filter({frequency:e.dampening,type:"lowpass",Q:0,rolloff:-12}),this.dampening=this._lowpass.frequency,this.resonance=this._combFilter.resonance,this._lowpass.connect(this._combFilter),this._readOnly(["dampening","resonance","delayTime"])},t.extend(t.LowpassCombFilter,t.AudioNode),t.LowpassCombFilter.defaults={delayTime:.1,resonance:.5,dampening:3e3},t.LowpassCombFilter.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._writable(["dampening","resonance","delayTime"]),this._combFilter.dispose(),this._combFilter=null,this.resonance=null,this.delayTime=null,this._lowpass.dispose(),this._lowpass=null,this.dampening=null,this},t.LowpassCombFilter}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(45)],void 0===(o=function(t){return t.Ticks=function(e,i){if(!(this instanceof t.Ticks))return new t.Ticks(e,i);t.TransportTime.call(this,e,i)},t.extend(t.Ticks,t.TransportTime),t.Ticks.prototype._defaultUnits="i",t.Ticks.prototype._now=function(){return t.Transport.ticks},t.Ticks.prototype._beatsToUnits=function(t){return this._getPPQ()*t},t.Ticks.prototype._secondsToUnits=function(t){return Math.floor(t/(60/this._getBpm())*this._getPPQ())},t.Ticks.prototype._ticksToUnits=function(t){return t},t.Ticks.prototype.toTicks=function(){return this.valueOf()},t.Ticks.prototype.toSeconds=function(){return this.valueOf()/this._getPPQ()*(60/this._getBpm())},t.Ticks}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(54)],void 0===(o=function(t){return t.TransportEvent=function(e,i){i=t.defaultArg(i,t.TransportEvent.defaults),t.call(this),this.Transport=e,this.id=t.TransportEvent._eventId++,this.time=t.Ticks(i.time),this.callback=i.callback,this._once=i.once},t.extend(t.TransportEvent),t.TransportEvent.defaults={once:!1,callback:t.noOp},t.TransportEvent._eventId=0,t.TransportEvent.prototype.invoke=function(t){this.callback&&(this.callback(t),this._once&&this.Transport&&this.Transport.clear(this.id))},t.TransportEvent.prototype.dispose=function(){return t.prototype.dispose.call(this),this.Transport=null,this.callback=null,this.time=null,this},t.TransportEvent}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(85),i(33),i(24),i(14)],void 0===(o=function(t){"use strict";return t.TickSource=function(){var e=t.defaults(arguments,["frequency"],t.TickSource);this.frequency=new t.TickSignal(e.frequency),this._readOnly("frequency"),this._state=new t.TimelineState(t.State.Stopped),this._state.setStateAtTime(t.State.Stopped,0),this._tickOffset=new t.Timeline,this.setTicksAtTime(0,0)},t.extend(t.TickSource),t.TickSource.defaults={frequency:1},Object.defineProperty(t.TickSource.prototype,"state",{get:function(){return this._state.getValueAtTime(this.now())}}),t.TickSource.prototype.start=function(e,i){return e=this.toSeconds(e),this._state.getValueAtTime(e)!==t.State.Started&&(this._state.setStateAtTime(t.State.Started,e),t.isDefined(i)&&this.setTicksAtTime(i,e)),this},t.TickSource.prototype.stop=function(e){if(e=this.toSeconds(e),this._state.getValueAtTime(e)===t.State.Stopped){var i=this._state.get(e);i.time>0&&(this._tickOffset.cancel(i.time),this._state.cancel(i.time))}return this._state.cancel(e),this._state.setStateAtTime(t.State.Stopped,e),this.setTicksAtTime(0,e),this},t.TickSource.prototype.pause=function(e){return e=this.toSeconds(e),this._state.getValueAtTime(e)===t.State.Started&&this._state.setStateAtTime(t.State.Paused,e),this},t.TickSource.prototype.cancel=function(t){return t=this.toSeconds(t),this._state.cancel(t),this._tickOffset.cancel(t),this},t.TickSource.prototype.getTicksAtTime=function(e){e=this.toSeconds(e);var i=this._state.getLastState(t.State.Stopped,e),n={state:t.State.Paused,time:e};this._state.add(n);var o=i,s=0;return this._state.forEachBetween(i.time,e+this.sampleTime,function(e){var i=o.time,n=this._tickOffset.get(e.time);n.time>=o.time&&(s=n.ticks,i=n.time),o.state===t.State.Started&&e.state!==t.State.Started&&(s+=this.frequency.getTicksAtTime(e.time)-this.frequency.getTicksAtTime(i)),o=e}.bind(this)),this._state.remove(n),s},Object.defineProperty(t.TickSource.prototype,"ticks",{get:function(){return this.getTicksAtTime(this.now())},set:function(t){this.setTicksAtTime(t,this.now())}}),Object.defineProperty(t.TickSource.prototype,"seconds",{get:function(){return this.getSecondsAtTime(this.now())},set:function(t){var e=this.now(),i=this.frequency.timeToTicks(t,e);this.setTicksAtTime(i,e)}}),t.TickSource.prototype.getSecondsAtTime=function(e){e=this.toSeconds(e);var i=this._state.getLastState(t.State.Stopped,e),n={state:t.State.Paused,time:e};this._state.add(n);var o=i,s=0;return this._state.forEachBetween(i.time,e+this.sampleTime,function(e){var i=o.time,n=this._tickOffset.get(e.time);n.time>=o.time&&(s=n.seconds,i=n.time),o.state===t.State.Started&&e.state!==t.State.Started&&(s+=e.time-i),o=e}.bind(this)),this._state.remove(n),s},t.TickSource.prototype.setTicksAtTime=function(t,e){return e=this.toSeconds(e),this._tickOffset.cancel(e),this._tickOffset.add({time:e,ticks:t,seconds:this.frequency.getDurationOfTicks(t,e)}),this},t.TickSource.prototype.getStateAtTime=function(t){return t=this.toSeconds(t),this._state.getValueAtTime(t)},t.TickSource.prototype.getTimeOfTick=function(e,i){i=t.defaultArg(i,this.now());var n=this._tickOffset.get(i),o=this._state.get(i),s=Math.max(n.time,o.time),r=this.frequency.getTicksAtTime(s)+e-n.ticks;return this.frequency.getTimeOfTick(r)},t.TickSource.prototype.forEachTickBetween=function(e,i,n){var o=this._state.get(e);if(this._state.forEachBetween(e,i,function(i){o.state===t.State.Started&&i.state!==t.State.Started&&this.forEachTickBetween(Math.max(o.time,e),i.time-this.sampleTime,n),o=i}.bind(this)),e=Math.max(o.time,e),o.state===t.State.Started&&this._state){var s=this.frequency.getTicksAtTime(e),r=(s-this.frequency.getTicksAtTime(o.time))%1;0!==r&&(r=1-r);for(var a=this.frequency.getTimeOfTick(s+r),l=null;a<i&&this._state;){try{n(a,Math.round(this.getTicksAtTime(a)))}catch(t){l=t;break}this._state&&(a+=this.frequency.getDurationOfTicks(1,a))}}if(l)throw l;return this},t.TickSource.prototype.dispose=function(){return t.Param.prototype.dispose.call(this),this._state.dispose(),this._state=null,this._tickOffset.dispose(),this._tickOffset=null,this._writable("frequency"),this.frequency.dispose(),this.frequency=null,this},t.TickSource}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(90),i(13),i(1),i(4),i(18),i(2)],void 0===(o=function(t){"use strict";return t.Follower=function(){var e=t.defaults(arguments,["smoothing"],t.Follower);t.AudioNode.call(this),this.createInsOuts(1,1),this._abs=new t.Abs,this._filter=this.context.createBiquadFilter(),this._filter.type="lowpass",this._filter.frequency.value=0,this._filter.Q.value=0,this._sub=new t.Subtract,this._delay=new t.Delay(this.blockTime),this._smoothing=e.smoothing,this.input.connect(this._delay,this._sub),this.input.connect(this._sub,0,1),this._sub.chain(this._abs,this._filter,this.output),this.smoothing=e.smoothing},t.extend(t.Follower,t.AudioNode),t.Follower.defaults={smoothing:.05},Object.defineProperty(t.Follower.prototype,"smoothing",{get:function(){return this._smoothing},set:function(e){this._smoothing=e,this._filter.frequency.value=.5*t.Time(e).toFrequency()}}),t.Follower.prototype.connect=t.SignalBase.prototype.connect,t.Follower.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._filter.disconnect(),this._filter=null,this._delay.dispose(),this._delay=null,this._sub.disconnect(),this._sub=null,this._abs.dispose(),this._abs=null,this},t.Follower}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(42),i(1),i(14),i(18),i(3),i(2)],void 0===(o=function(t){"use strict";return t.FeedbackCombFilter=function(){var e=t.defaults(arguments,["delayTime","resonance"],t.FeedbackCombFilter);t.AudioNode.call(this),this._delay=this.input=this.output=new t.Delay(e.delayTime),this.delayTime=this._delay.delayTime,this._feedback=new t.Gain(e.resonance,t.Type.NormalRange),this.resonance=this._feedback.gain,this._delay.chain(this._feedback,this._delay),this._readOnly(["resonance","delayTime"])},t.extend(t.FeedbackCombFilter,t.AudioNode),t.FeedbackCombFilter.defaults={delayTime:.1,resonance:.5},t.FeedbackCombFilter.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._writable(["resonance","delayTime"]),this._delay.dispose(),this._delay=null,this.delayTime=null,this._feedback.dispose(),this._feedback=null,this.resonance=null,this},t.FeedbackCombFilter}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(9),i(1),i(3),i(2)],void 0===(o=function(t){"use strict";return t.MultibandSplit=function(){var e=t.defaults(arguments,["lowFrequency","highFrequency"],t.MultibandSplit);t.AudioNode.call(this),this.input=new t.Gain,this.output=new Array(3),this.low=this.output[0]=new t.Filter(0,"lowpass"),this._lowMidFilter=new t.Filter(0,"highpass"),this.mid=this.output[1]=new t.Filter(0,"lowpass"),this.high=this.output[2]=new t.Filter(0,"highpass"),this.lowFrequency=new t.Signal(e.lowFrequency,t.Type.Frequency),this.highFrequency=new t.Signal(e.highFrequency,t.Type.Frequency),this.Q=new t.Signal(e.Q),this.input.fan(this.low,this.high),this.input.chain(this._lowMidFilter,this.mid),this.lowFrequency.connect(this.low.frequency),this.lowFrequency.connect(this._lowMidFilter.frequency),this.highFrequency.connect(this.mid.frequency),this.highFrequency.connect(this.high.frequency),this.Q.connect(this.low.Q),this.Q.connect(this._lowMidFilter.Q),this.Q.connect(this.mid.Q),this.Q.connect(this.high.Q),this._readOnly(["high","mid","low","highFrequency","lowFrequency"])},t.extend(t.MultibandSplit,t.AudioNode),t.MultibandSplit.defaults={lowFrequency:400,highFrequency:2500,Q:1},t.MultibandSplit.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._writable(["high","mid","low","highFrequency","lowFrequency"]),this.low.dispose(),this.low=null,this._lowMidFilter.dispose(),this._lowMidFilter=null,this.mid.dispose(),this.mid=null,this.high.dispose(),this.high=null,this.lowFrequency.dispose(),this.lowFrequency=null,this.highFrequency.dispose(),this.highFrequency=null,this.Q.dispose(),this.Q=null,this},t.MultibandSplit}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(23),i(10),i(19),i(92),i(1),i(22),i(28),i(2)],void 0===(o=function(t){"use strict";return t.Panner=function(e){t.AudioNode.call(this),this._panner=this.input=this.output=this.context.createStereoPanner(),this.pan=this._panner.pan,this.pan.value=t.defaultArg(e,0),this._readOnly("pan")},t.extend(t.Panner,t.AudioNode),t.Panner.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._writable("pan"),this._panner.disconnect(),this._panner=null,this.pan=null,this},t.Panner}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(7)],void 0===(o=function(t){"use strict";return t.Pow=function(e){t.SignalBase.call(this),this._exp=t.defaultArg(e,1),this._expScaler=this.input=this.output=new t.WaveShaper(this._expFunc(this._exp),8192)},t.extend(t.Pow,t.SignalBase),Object.defineProperty(t.Pow.prototype,"value",{get:function(){return this._exp},set:function(t){this._exp=t,this._expScaler.setMap(this._expFunc(this._exp))}}),t.Pow.prototype._expFunc=function(t){return function(e){return Math.pow(Math.abs(e),t)}},t.Pow.prototype.dispose=function(){return t.SignalBase.prototype.dispose.call(this),this._expScaler.dispose(),this._expScaler=null,this},t.Pow}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(20),i(66)],void 0===(o=function(t){return t.OfflineContext=function(e,i,n){var o=new OfflineAudioContext(e,i*n,n);t.Context.call(this,{context:o,clockSource:"offline",lookAhead:0,updateInterval:128/n}),this._duration=i,this._currentTime=0},t.extend(t.OfflineContext,t.Context),t.OfflineContext.prototype.now=function(){return this._currentTime},t.OfflineContext.prototype.resume=function(){return Promise.resolve()},t.OfflineContext.prototype.render=function(){for(;this._duration-this._currentTime>=0;)this.emit("tick"),this._currentTime+=this.blockTime;return this._context.startRendering()},t.OfflineContext.prototype.close=function(){return this._context=null,Promise.resolve()},t.OfflineContext}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(62)],void 0===(o=function(t){if(t.supported){var e=navigator.userAgent.toLowerCase();e.includes("safari")&&!e.includes("chrome")&&e.includes("mobile")&&(t.OfflineContext.prototype.createBufferSource=function(){var t=this._context.createBufferSource(),e=t.start;return t.start=function(i){this.setTimeout(function(){e.call(t,i)}.bind(this),0)}.bind(this),t})}}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0)],void 0===(o=function(t){return t.TimeBase=function(e,i){if(!(this instanceof t.TimeBase))return new t.TimeBase(e,i);if(this._val=e,this._units=i,t.isUndef(this._units)&&t.isString(this._val)&&parseFloat(this._val)==this._val&&"+"!==this._val.charAt(0))this._val=parseFloat(this._val),this._units=this._defaultUnits;else if(e&&e.constructor===this.constructor)this._val=e._val,this._units=e._units;else if(e instanceof t.TimeBase)switch(this._defaultUnits){case"s":this._val=e.toSeconds();break;case"i":this._val=e.toTicks();break;case"hz":this._val=e.toFrequency();break;case"midi":this._val=e.toMidi();break;default:throw new Error("Unrecognized default units "+this._defaultUnits)}},t.extend(t.TimeBase),t.TimeBase.prototype._expressions={n:{regexp:/^(\d+)n(\.?)$/i,method:function(t,e){t=parseInt(t);var i="."===e?1.5:1;return 1===t?this._beatsToUnits(this._getTimeSignature())*i:this._beatsToUnits(4/t)*i}},t:{regexp:/^(\d+)t$/i,method:function(t){return t=parseInt(t),this._beatsToUnits(8/(3*parseInt(t)))}},m:{regexp:/^(\d+)m$/i,method:function(t){return this._beatsToUnits(parseInt(t)*this._getTimeSignature())}},i:{regexp:/^(\d+)i$/i,method:function(t){return this._ticksToUnits(parseInt(t))}},hz:{regexp:/^(\d+(?:\.\d+)?)hz$/i,method:function(t){return this._frequencyToUnits(parseFloat(t))}},tr:{regexp:/^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?):?(\d+(?:\.\d+)?)?$/,method:function(t,e,i){var n=0;return t&&"0"!==t&&(n+=this._beatsToUnits(this._getTimeSignature()*parseFloat(t))),e&&"0"!==e&&(n+=this._beatsToUnits(parseFloat(e))),i&&"0"!==i&&(n+=this._beatsToUnits(parseFloat(i)/4)),n}},s:{regexp:/^(\d+(?:\.\d+)?)s$/,method:function(t){return this._secondsToUnits(parseFloat(t))}},samples:{regexp:/^(\d+)samples$/,method:function(t){return parseInt(t)/this.context.sampleRate}},default:{regexp:/^(\d+(?:\.\d+)?)$/,method:function(t){return this._expressions[this._defaultUnits].method.call(this,t)}}},t.TimeBase.prototype._defaultUnits="s",t.TimeBase.prototype._getBpm=function(){return t.Transport?t.Transport.bpm.value:120},t.TimeBase.prototype._getTimeSignature=function(){return t.Transport?t.Transport.timeSignature:4},t.TimeBase.prototype._getPPQ=function(){return t.Transport?t.Transport.PPQ:192},t.TimeBase.prototype._now=function(){return this.now()},t.TimeBase.prototype._frequencyToUnits=function(t){return 1/t},t.TimeBase.prototype._beatsToUnits=function(t){return 60/this._getBpm()*t},t.TimeBase.prototype._secondsToUnits=function(t){return t},t.TimeBase.prototype._ticksToUnits=function(t){return t*(this._beatsToUnits(1)/this._getPPQ())},t.TimeBase.prototype._noArg=function(){return this._now()},t.TimeBase.prototype.valueOf=function(){if(t.isUndef(this._val))return this._noArg();if(t.isString(this._val)&&t.isUndef(this._units)){for(var e in this._expressions)if(this._expressions[e].regexp.test(this._val.trim())){this._units=e;break}}else if(t.isObject(this._val)){var i=0;for(var n in this._val){var o=this._val[n];i+=new this.constructor(n).valueOf()*o}return i}if(t.isDefined(this._units)){var s=this._expressions[this._units],r=this._val.toString().trim().match(s.regexp);return r?s.method.apply(this,r.slice(1)):s.method.call(this,parseFloat(this._val))}return this._val},t.TimeBase.prototype.toSeconds=function(){return this.valueOf()},t.TimeBase.prototype.toFrequency=function(){return 1/this.toSeconds()},t.TimeBase.prototype.toSamples=function(){return this.toSeconds()*this.context.sampleRate},t.TimeBase.prototype.toMilliseconds=function(){return 1e3*this.toSeconds()},t.TimeBase.prototype.dispose=function(){this._val=null,this._units=null},t.TimeBase}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(64),i(46)],void 0===(o=function(t){return t.Time=function(e,i){if(!(this instanceof t.Time))return new t.Time(e,i);t.TimeBase.call(this,e,i)},t.extend(t.Time,t.TimeBase),t.Time.prototype._expressions=Object.assign({},t.TimeBase.prototype._expressions,{quantize:{regexp:/^@(.+)/,method:function(e){if(t.Transport){var i=new this.constructor(e);return this._secondsToUnits(t.Transport.nextSubdivision(i))}return 0}},now:{regexp:/^\+(.+)/,method:function(t){return this._now()+new this.constructor(t)}}}),t.Time.prototype.quantize=function(e,i){i=t.defaultArg(i,1);var n=new this.constructor(e),o=this.valueOf();return o+(Math.round(o/n)*n-o)*i},t.Time.prototype.toNotation=function(){for(var e=this.toSeconds(),i=["1m"],n=1;n<8;n++){var o=Math.pow(2,n);i.push(o+"n."),i.push(o+"n"),i.push(o+"t")}i.push("0");var s=i[0],r=t.Time(i[0]).toSeconds();return i.forEach(function(i){var n=t.Time(i).toSeconds();Math.abs(n-e)<Math.abs(r-e)&&(s=i,r=n)}),s},t.Time.prototype.toBarsBeatsSixteenths=function(){var t=this._beatsToUnits(1),e=this.valueOf()/t;e=parseFloat(e.toFixed(4));var i=Math.floor(e/this._getTimeSignature()),n=e%1*4;return e=Math.floor(e)%this._getTimeSignature(),(n=n.toString()).length>3&&(n=parseFloat(parseFloat(n).toFixed(3))),[i,e,n].join(":")},t.Time.prototype.toTicks=function(){var t=this._beatsToUnits(1),e=this.valueOf()/t;return Math.round(e*this._getPPQ())},t.Time.prototype.toSeconds=function(){return this.valueOf()},t.Time.prototype.toMidi=function(){return t.Frequency.ftom(this.toFrequency())},t.Time}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0)],void 0===(o=function(t){if(t.supported){!t.global.hasOwnProperty("OfflineAudioContext")&&t.global.hasOwnProperty("webkitOfflineAudioContext")&&(t.global.OfflineAudioContext=t.global.webkitOfflineAudioContext);var e=new OfflineAudioContext(1,1,44100).startRendering();e&&t.isFunction(e.then)||(OfflineAudioContext.prototype._native_startRendering=OfflineAudioContext.prototype.startRendering,OfflineAudioContext.prototype.startRendering=function(){return new Promise(function(t){this.oncomplete=function(e){t(e.renderedBuffer)},this._native_startRendering()}.bind(this))})}}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(11),i(6),i(56),i(31)],void 0===(o=function(t){"use strict";return t.Player=function(e){var i;e instanceof t.Buffer&&e.loaded?(e=e.get(),i=t.Player.defaults):i=t.defaults(arguments,["url","onload"],t.Player),t.Source.call(this,i),this.autostart=i.autostart,this._buffer=new t.Buffer({url:i.url,onload:this._onload.bind(this,i.onload),reverse:i.reverse}),e instanceof AudioBuffer&&this._buffer.set(e),this._loop=i.loop,this._loopStart=i.loopStart,this._loopEnd=i.loopEnd,this._playbackRate=i.playbackRate,this._activeSources=[],this.fadeIn=i.fadeIn,this.fadeOut=i.fadeOut},t.extend(t.Player,t.Source),t.Player.defaults={onload:t.noOp,playbackRate:1,loop:!1,autostart:!1,loopStart:0,loopEnd:0,reverse:!1,fadeIn:0,fadeOut:0},t.Player.prototype.load=function(t,e){return this._buffer.load(t,this._onload.bind(this,e))},t.Player.prototype._onload=function(e){(e=t.defaultArg(e,t.noOp))(this),this.autostart&&this.start()},t.Player.prototype._onSourceEnd=function(e){var i=this._activeSources.indexOf(e);this._activeSources.splice(i,1),0!==this._activeSources.length||this._synced||this._state.setStateAtTime(t.State.Stopped,t.now())},t.Player.prototype._start=function(e,i,n){i=this._loop?t.defaultArg(i,this._loopStart):t.defaultArg(i,0),i=this.toSeconds(i);var o=t.defaultArg(n,Math.max(this._buffer.duration-i,0));o=this.toSeconds(o),o/=this._playbackRate,e=this.toSeconds(e);var s=new t.BufferSource({buffer:this._buffer,loop:this._loop,loopStart:this._loopStart,loopEnd:this._loopEnd,onended:this._onSourceEnd.bind(this),playbackRate:this._playbackRate,fadeIn:this.fadeIn,fadeOut:this.fadeOut}).connect(this.output);return this._loop||this._synced||this._state.setStateAtTime(t.State.Stopped,e+o),this._activeSources.push(s),this._loop&&t.isUndef(n)?s.start(e,i):s.start(e,i,o-this.toSeconds(this.fadeOut)),this},t.Player.prototype._stop=function(t){return t=this.toSeconds(t),this._activeSources.forEach(function(e){e.stop(t)}),this},t.Player.prototype.restart=function(t,e,i){return this._stop(t),this._start(t,e,i),this},t.Player.prototype.seek=function(e,i){return i=this.toSeconds(i),this._state.getValueAtTime(i)===t.State.Started&&(e=this.toSeconds(e),this._stop(i),this._start(i,e)),this},t.Player.prototype.setLoopPoints=function(t,e){return this.loopStart=t,this.loopEnd=e,this},Object.defineProperty(t.Player.prototype,"loopStart",{get:function(){return this._loopStart},set:function(t){this._loopStart=t,this._activeSources.forEach(function(e){e.loopStart=t})}}),Object.defineProperty(t.Player.prototype,"loopEnd",{get:function(){return this._loopEnd},set:function(t){this._loopEnd=t,this._activeSources.forEach(function(e){e.loopEnd=t})}}),Object.defineProperty(t.Player.prototype,"buffer",{get:function(){return this._buffer},set:function(t){this._buffer.set(t)}}),Object.defineProperty(t.Player.prototype,"loop",{get:function(){return this._loop},set:function(e){if(this._loop!==e&&(this._loop=e,this._activeSources.forEach(function(t){t.loop=e}),e)){var i=this._state.getNextState(t.State.Stopped,this.now());i&&this._state.cancel(i.time)}}}),Object.defineProperty(t.Player.prototype,"playbackRate",{get:function(){return this._playbackRate},set:function(e){this._playbackRate=e;var i=this.now(),n=this._state.getNextState(t.State.Stopped,i);n&&this._state.cancel(n.time),this._activeSources.forEach(function(t){t.cancelStop(),t.playbackRate.setValueAtTime(e,i)})}}),Object.defineProperty(t.Player.prototype,"reverse",{get:function(){return this._buffer.reverse},set:function(t){this._buffer.reverse=t}}),Object.defineProperty(t.Player.prototype,"loaded",{get:function(){return this._buffer.loaded}}),t.Player.prototype.dispose=function(){return this._activeSources.forEach(function(t){t.dispose()}),this._activeSources=null,t.Source.prototype.dispose.call(this),this._buffer.dispose(),this._buffer=null,this},t.Player}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(30),i(41),i(37),i(1),i(9),i(25)],void 0===(o=function(t){"use strict";return t.MonoSynth=function(e){e=t.defaultArg(e,t.MonoSynth.defaults),t.Monophonic.call(this,e),this.oscillator=new t.OmniOscillator(e.oscillator),this.frequency=this.oscillator.frequency,this.detune=this.oscillator.detune,this.filter=new t.Filter(e.filter),this.filter.frequency.value=5e3,this.filterEnvelope=new t.FrequencyEnvelope(e.filterEnvelope),this.envelope=new t.AmplitudeEnvelope(e.envelope),this.oscillator.chain(this.filter,this.envelope,this.output),this.filterEnvelope.connect(this.filter.frequency),this._readOnly(["oscillator","frequency","detune","filter","filterEnvelope","envelope"])},t.extend(t.MonoSynth,t.Monophonic),t.MonoSynth.defaults={frequency:"C4",detune:0,oscillator:{type:"square"},filter:{Q:6,type:"lowpass",rolloff:-24},envelope:{attack:.005,decay:.1,sustain:.9,release:1},filterEnvelope:{attack:.06,decay:.2,sustain:.5,release:2,baseFrequency:200,octaves:7,exponent:2}},t.MonoSynth.prototype._triggerEnvelopeAttack=function(t,e){return t=this.toSeconds(t),this.envelope.triggerAttack(t,e),this.filterEnvelope.triggerAttack(t),this.oscillator.start(t),0===this.envelope.sustain&&this.oscillator.stop(t+this.envelope.attack+this.envelope.decay),this},t.MonoSynth.prototype._triggerEnvelopeRelease=function(t){return this.envelope.triggerRelease(t),this.filterEnvelope.triggerRelease(t),this.oscillator.stop(t+this.envelope.release),this},t.MonoSynth.prototype.dispose=function(){return t.Monophonic.prototype.dispose.call(this),this._writable(["oscillator","frequency","detune","filter","filterEnvelope","envelope"]),this.oscillator.dispose(),this.oscillator=null,this.envelope.dispose(),this.envelope=null,this.filterEnvelope.dispose(),this.filterEnvelope=null,this.filter.dispose(),this.filter=null,this.frequency=null,this.detune=null,this},t.MonoSynth}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(6),i(17),i(5),i(3)],void 0===(o=function(t){"use strict";return t.FatOscillator=function(){var e=t.defaults(arguments,["frequency","type","spread"],t.FatOscillator);t.Source.call(this,e),this.frequency=new t.Signal(e.frequency,t.Type.Frequency),this.detune=new t.Signal(e.detune,t.Type.Cents),this._oscillators=[],this._spread=e.spread,this._type=e.type,this._phase=e.phase,this._partials=e.partials,this._partialCount=e.partialCount,this.count=e.count,this._readOnly(["frequency","detune"])},t.extend(t.FatOscillator,t.Source),t.FatOscillator.defaults={frequency:440,detune:0,phase:0,spread:20,count:3,type:"sawtooth",partials:[],partialCount:0},t.FatOscillator.prototype._start=function(t){t=this.toSeconds(t),this._forEach(function(e){e.start(t)})},t.FatOscillator.prototype._stop=function(t){t=this.toSeconds(t),this._forEach(function(e){e.stop(t)})},t.FatOscillator.prototype.restart=function(t){t=this.toSeconds(t),this._forEach(function(e){e.restart(t)})},t.FatOscillator.prototype._forEach=function(t){for(var e=0;e<this._oscillators.length;e++)t.call(this,this._oscillators[e],e)},Object.defineProperty(t.FatOscillator.prototype,"type",{get:function(){return this._type},set:function(t){this._type=t,this._forEach(function(e){e.type=t})}}),Object.defineProperty(t.FatOscillator.prototype,"spread",{get:function(){return this._spread},set:function(t){if(this._spread=t,this._oscillators.length>1){var e=-t/2,i=t/(this._oscillators.length-1);this._forEach(function(t,n){t.detune.value=e+i*n})}}}),Object.defineProperty(t.FatOscillator.prototype,"count",{get:function(){return this._oscillators.length},set:function(e){if(e=Math.max(e,1),this._oscillators.length!==e){this._forEach(function(t){t.dispose()}),this._oscillators=[];for(var i=0;i<e;i++){var n=new t.Oscillator;this.type===t.Oscillator.Type.Custom?n.partials=this._partials:n.type=this._type,n.partialCount=this._partialCount,n.phase=this._phase+i/e*360,n.volume.value=-6-1.1*e,this.frequency.connect(n.frequency),this.detune.connect(n.detune),n.connect(this.output),this._oscillators[i]=n}this.spread=this._spread,this.state===t.State.Started&&this._forEach(function(t){t.start()})}}}),Object.defineProperty(t.FatOscillator.prototype,"phase",{get:function(){return this._phase},set:function(t){this._phase=t,this._forEach(function(e){e.phase=t})}}),Object.defineProperty(t.FatOscillator.prototype,"baseType",{get:function(){return this._oscillators[0].baseType},set:function(t){this._forEach(function(e){e.baseType=t}),this._type=this._oscillators[0].type}}),Object.defineProperty(t.FatOscillator.prototype,"partials",{get:function(){return this._oscillators[0].partials},set:function(e){this._partials=e,this._type=t.Oscillator.Type.Custom,this._forEach(function(t){t.partials=e})}}),Object.defineProperty(t.FatOscillator.prototype,"partialCount",{get:function(){return this._oscillators[0].partialCount},set:function(t){this._partialCount=t,this._forEach(function(e){e.partialCount=t}),this._type=this._oscillators[0].type}}),t.FatOscillator.prototype.dispose=function(){return t.Source.prototype.dispose.call(this),this._writable(["frequency","detune"]),this.frequency.dispose(),this.frequency=null,this.detune.dispose(),this.detune=null,this._forEach(function(t){t.dispose()}),this._oscillators=null,this._partials=null,this},t.FatOscillator}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(6),i(17),i(5),i(3),i(22)],void 0===(o=function(t){"use strict";return t.AMOscillator=function(){var e=t.defaults(arguments,["frequency","type","modulationType"],t.AMOscillator);t.Source.call(this,e),this._carrier=new t.Oscillator(e.frequency,e.type),this.frequency=this._carrier.frequency,this.detune=this._carrier.detune,this.detune.value=e.detune,this._modulator=new t.Oscillator(e.frequency,e.modulationType),this._modulationScale=new t.AudioToGain,this.harmonicity=new t.Multiply(e.harmonicity),this.harmonicity.units=t.Type.Positive,this._modulationNode=new t.Gain(0),this.frequency.chain(this.harmonicity,this._modulator.frequency),this.detune.connect(this._modulator.detune),this._modulator.chain(this._modulationScale,this._modulationNode.gain),this._carrier.chain(this._modulationNode,this.output),this.phase=e.phase,this._readOnly(["frequency","detune","harmonicity"])},t.extend(t.AMOscillator,t.Oscillator),t.AMOscillator.defaults={frequency:440,detune:0,phase:0,type:"sine",modulationType:"square",harmonicity:1},t.AMOscillator.prototype._start=function(t){this._modulator.start(t),this._carrier.start(t)},t.AMOscillator.prototype._stop=function(t){this._modulator.stop(t),this._carrier.stop(t)},t.AMOscillator.prototype.restart=function(t){this._modulator.restart(t),this._carrier.restart(t)},Object.defineProperty(t.AMOscillator.prototype,"type",{get:function(){return this._carrier.type},set:function(t){this._carrier.type=t}}),Object.defineProperty(t.AMOscillator.prototype,"baseType",{get:function(){return this._carrier.baseType},set:function(t){this._carrier.baseType=t}}),Object.defineProperty(t.AMOscillator.prototype,"partialCount",{get:function(){return this._carrier.partialCount},set:function(t){this._carrier.partialCount=t}}),Object.defineProperty(t.AMOscillator.prototype,"modulationType",{get:function(){return this._modulator.type},set:function(t){this._modulator.type=t}}),Object.defineProperty(t.AMOscillator.prototype,"phase",{get:function(){return this._carrier.phase},set:function(t){this._carrier.phase=t,this._modulator.phase=t}}),Object.defineProperty(t.AMOscillator.prototype,"partials",{get:function(){return this._carrier.partials},set:function(t){this._carrier.partials=t}}),t.AMOscillator.prototype.dispose=function(){return t.Source.prototype.dispose.call(this),this._writable(["frequency","detune","harmonicity"]),this.frequency=null,this.detune=null,this.harmonicity.dispose(),this.harmonicity=null,this._carrier.dispose(),this._carrier=null,this._modulator.dispose(),this._modulator=null,this._modulationNode.dispose(),this._modulationNode=null,this._modulationScale.dispose(),this._modulationScale=null,this},t.AMOscillator}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(6),i(49),i(17),i(5)],void 0===(o=function(t){"use strict";return t.PWMOscillator=function(){var e=t.defaults(arguments,["frequency","modulationFrequency"],t.PWMOscillator);t.Source.call(this,e),this._pulse=new t.PulseOscillator(e.modulationFrequency),this._pulse._sawtooth.type="sine",this._modulator=new t.Oscillator({frequency:e.frequency,detune:e.detune,phase:e.phase}),this._scale=new t.Multiply(2),this.frequency=this._modulator.frequency,this.detune=this._modulator.detune,this.modulationFrequency=this._pulse.frequency,this._modulator.chain(this._scale,this._pulse.width),this._pulse.connect(this.output),this._readOnly(["modulationFrequency","frequency","detune"])},t.extend(t.PWMOscillator,t.Source),t.PWMOscillator.defaults={frequency:440,detune:0,phase:0,modulationFrequency:.4},t.PWMOscillator.prototype._start=function(t){t=this.toSeconds(t),this._modulator.start(t),this._pulse.start(t)},t.PWMOscillator.prototype._stop=function(t){t=this.toSeconds(t),this._modulator.stop(t),this._pulse.stop(t)},t.PWMOscillator.prototype.restart=function(t){this._modulator.restart(t),this._pulse.restart(t)},Object.defineProperty(t.PWMOscillator.prototype,"type",{get:function(){return"pwm"}}),Object.defineProperty(t.PWMOscillator.prototype,"baseType",{get:function(){return"pwm"}}),Object.defineProperty(t.PWMOscillator.prototype,"partials",{get:function(){return[]}}),Object.defineProperty(t.PWMOscillator.prototype,"phase",{get:function(){return this._modulator.phase},set:function(t){this._modulator.phase=t}}),t.PWMOscillator.prototype.dispose=function(){return t.Source.prototype.dispose.call(this),this._pulse.dispose(),this._pulse=null,this._scale.dispose(),this._scale=null,this._modulator.dispose(),this._modulator=null,this._writable(["modulationFrequency","frequency","detune"]),this.frequency=null,this.detune=null,this.modulationFrequency=null,this},t.PWMOscillator}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(50),i(4),i(16)],void 0===(o=function(t){"use strict";return t.Part=function(){var e=t.defaults(arguments,["callback","events"],t.Part);t.Event.call(this,e),this._events=[];for(var i=0;i<e.events.length;i++)Array.isArray(e.events[i])?this.add(e.events[i][0],e.events[i][1]):this.add(e.events[i])},t.extend(t.Part,t.Event),t.Part.defaults={callback:t.noOp,loop:!1,loopEnd:"1m",loopStart:0,playbackRate:1,probability:1,humanize:!1,mute:!1,events:[]},t.Part.prototype.start=function(e,i){var n=this.toTicks(e);return this._state.getValueAtTime(n)!==t.State.Started&&(i=this._loop?t.defaultArg(i,this._loopStart):t.defaultArg(i,0),i=this.toTicks(i),this._state.add({state:t.State.Started,time:n,offset:i}),this._forEach(function(t){this._startNote(t,n,i)})),this},t.Part.prototype._startNote=function(e,i,n){i-=n,this._loop?e.startOffset>=this._loopStart&&e.startOffset<this._loopEnd?(e.startOffset<n&&(i+=this._getLoopDuration()),e.start(t.Ticks(i))):e.startOffset<this._loopStart&&e.startOffset>=n&&(e.loop=!1,e.start(t.Ticks(i))):e.startOffset>=n&&e.start(t.Ticks(i))},Object.defineProperty(t.Part.prototype,"startOffset",{get:function(){return this._startOffset},set:function(t){this._startOffset=t,this._forEach(function(t){t.startOffset+=this._startOffset})}}),t.Part.prototype.stop=function(e){var i=this.toTicks(e);return this._state.cancel(i),this._state.setStateAtTime(t.State.Stopped,i),this._forEach(function(t){t.stop(e)}),this},t.Part.prototype.at=function(e,i){e=t.TransportTime(e);for(var n=t.Ticks(1).toSeconds(),o=0;o<this._events.length;o++){var s=this._events[o];if(Math.abs(e.toTicks()-s.startOffset)<n)return t.isDefined(i)&&(s.value=i),s}return t.isDefined(i)?(this.add(e,i),this._events[this._events.length-1]):null},t.Part.prototype.add=function(e,i){var n;return e.hasOwnProperty("time")&&(e=(i=e).time),e=this.toTicks(e),i instanceof t.Event?(n=i).callback=this._tick.bind(this):n=new t.Event({callback:this._tick.bind(this),value:i}),n.startOffset=e,n.set({loopEnd:this.loopEnd,loopStart:this.loopStart,loop:this.loop,humanize:this.humanize,playbackRate:this.playbackRate,probability:this.probability}),this._events.push(n),this._restartEvent(n),this},t.Part.prototype._restartEvent=function(e){this._state.forEach(function(i){i.state===t.State.Started?this._startNote(e,i.time,i.offset):e.stop(t.Ticks(i.time))}.bind(this))},t.Part.prototype.remove=function(e,i){e.hasOwnProperty("time")&&(e=(i=e).time),e=this.toTicks(e);for(var n=this._events.length-1;n>=0;n--){var o=this._events[n];o.startOffset===e&&(t.isUndef(i)||t.isDefined(i)&&o.value===i)&&(this._events.splice(n,1),o.dispose())}return this},t.Part.prototype.removeAll=function(){return this._forEach(function(t){t.dispose()}),this._events=[],this},t.Part.prototype.cancel=function(t){return this._forEach(function(e){e.cancel(t)}),this._state.cancel(this.toTicks(t)),this},t.Part.prototype._forEach=function(e,i){if(this._events){i=t.defaultArg(i,this);for(var n=this._events.length-1;n>=0;n--){var o=this._events[n];o instanceof t.Part?o._forEach(e,i):e.call(i,o)}}return this},t.Part.prototype._setAll=function(t,e){this._forEach(function(i){i[t]=e})},t.Part.prototype._tick=function(t,e){this.mute||this.callback(t,e)},t.Part.prototype._testLoopBoundries=function(e){e.startOffset<this._loopStart||e.startOffset>=this._loopEnd?e.cancel(0):e.state===t.State.Stopped&&this._restartEvent(e)},Object.defineProperty(t.Part.prototype,"probability",{get:function(){return this._probability},set:function(t){this._probability=t,this._setAll("probability",t)}}),Object.defineProperty(t.Part.prototype,"humanize",{get:function(){return this._humanize},set:function(t){this._humanize=t,this._setAll("humanize",t)}}),Object.defineProperty(t.Part.prototype,"loop",{get:function(){return this._loop},set:function(t){this._loop=t,this._forEach(function(e){e._loopStart=this._loopStart,e._loopEnd=this._loopEnd,e.loop=t,this._testLoopBoundries(e)})}}),Object.defineProperty(t.Part.prototype,"loopEnd",{get:function(){return t.Ticks(this._loopEnd).toSeconds()},set:function(t){this._loopEnd=this.toTicks(t),this._loop&&this._forEach(function(e){e.loopEnd=t,this._testLoopBoundries(e)})}}),Object.defineProperty(t.Part.prototype,"loopStart",{get:function(){return t.Ticks(this._loopStart).toSeconds()},set:function(t){this._loopStart=this.toTicks(t),this._loop&&this._forEach(function(t){t.loopStart=this.loopStart,this._testLoopBoundries(t)})}}),Object.defineProperty(t.Part.prototype,"playbackRate",{get:function(){return this._playbackRate},set:function(t){this._playbackRate=t,this._setAll("playbackRate",t)}}),Object.defineProperty(t.Part.prototype,"length",{get:function(){return this._events.length}}),t.Part.prototype.dispose=function(){return t.Event.prototype.dispose.call(this),this.removeAll(),this.callback=null,this._events=null,this},t.Part}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(50)],void 0===(o=function(t){return t.Loop=function(){var e=t.defaults(arguments,["callback","interval"],t.Loop);t.call(this),this._event=new t.Event({callback:this._tick.bind(this),loop:!0,loopEnd:e.interval,playbackRate:e.playbackRate,probability:e.probability}),this.callback=e.callback,this.iterations=e.iterations},t.extend(t.Loop),t.Loop.defaults={interval:"4n",callback:t.noOp,playbackRate:1,iterations:1/0,probability:!0,mute:!1},t.Loop.prototype.start=function(t){return this._event.start(t),this},t.Loop.prototype.stop=function(t){return this._event.stop(t),this},t.Loop.prototype.cancel=function(t){return this._event.cancel(t),this},t.Loop.prototype._tick=function(t){this.callback(t)},Object.defineProperty(t.Loop.prototype,"state",{get:function(){return this._event.state}}),Object.defineProperty(t.Loop.prototype,"progress",{get:function(){return this._event.progress}}),Object.defineProperty(t.Loop.prototype,"interval",{get:function(){return this._event.loopEnd},set:function(t){this._event.loopEnd=t}}),Object.defineProperty(t.Loop.prototype,"playbackRate",{get:function(){return this._event.playbackRate},set:function(t){this._event.playbackRate=t}}),Object.defineProperty(t.Loop.prototype,"humanize",{get:function(){return this._event.humanize},set:function(t){this._event.humanize=t}}),Object.defineProperty(t.Loop.prototype,"probability",{get:function(){return this._event.probability},set:function(t){this._event.probability=t}}),Object.defineProperty(t.Loop.prototype,"mute",{get:function(){return this._event.mute},set:function(t){this._event.mute=t}}),Object.defineProperty(t.Loop.prototype,"iterations",{get:function(){return!0===this._event.loop?1/0:this._event.loop},set:function(t){this._event.loop=t===1/0||t}}),t.Loop.prototype.dispose=function(){this._event.dispose(),this._event=null,this.callback=null},t.Loop}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(15),i(32)],void 0===(o=function(t){"use strict";return t.StereoXFeedbackEffect=function(){var e=t.defaults(arguments,["feedback"],t.FeedbackEffect);t.StereoEffect.call(this,e),this.feedback=new t.Signal(e.feedback,t.Type.NormalRange),this._feedbackLR=new t.Gain,this._feedbackRL=new t.Gain,this.effectReturnL.chain(this._feedbackLR,this.effectSendR),this.effectReturnR.chain(this._feedbackRL,this.effectSendL),this.feedback.fan(this._feedbackLR.gain,this._feedbackRL.gain),this._readOnly(["feedback"])},t.extend(t.StereoXFeedbackEffect,t.StereoEffect),t.StereoXFeedbackEffect.prototype.dispose=function(){return t.StereoEffect.prototype.dispose.call(this),this._writable(["feedback"]),this.feedback.dispose(),this.feedback=null,this._feedbackLR.dispose(),this._feedbackLR=null,this._feedbackRL.dispose(),this._feedbackRL=null,this},t.StereoXFeedbackEffect}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(8),i(52),i(51)],void 0===(o=function(t){"use strict";return t.MidSideEffect=function(){t.Effect.apply(this,arguments),this._midSideSplit=new t.MidSideSplit,this._midSideMerge=new t.MidSideMerge,this.midSend=this._midSideSplit.mid,this.sideSend=this._midSideSplit.side,this.midReturn=this._midSideMerge.mid,this.sideReturn=this._midSideMerge.side,this.effectSend.connect(this._midSideSplit),this._midSideMerge.connect(this.effectReturn)},t.extend(t.MidSideEffect,t.Effect),t.MidSideEffect.prototype.dispose=function(){return t.Effect.prototype.dispose.call(this),this._midSideSplit.dispose(),this._midSideSplit=null,this._midSideMerge.dispose(),this._midSideMerge=null,this.midSend=null,this.sideSend=null,this.midReturn=null,this.sideReturn=null,this},t.MidSideEffect}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(11),i(8)],void 0===(o=function(t){"use strict";return t.Convolver=function(){var e=t.defaults(arguments,["url","onload"],t.Convolver);t.Effect.call(this,e),this._convolver=this.context.createConvolver(),this._buffer=new t.Buffer(e.url,function(t){this.buffer=t.get(),e.onload()}.bind(this)),this._buffer.loaded&&(this.buffer=this._buffer),this.normalize=e.normalize,this.connectEffect(this._convolver)},t.extend(t.Convolver,t.Effect),t.Convolver.defaults={onload:t.noOp,normalize:!0},Object.defineProperty(t.Convolver.prototype,"buffer",{get:function(){return this._buffer.length?this._buffer:null},set:function(t){this._buffer.set(t),this._convolver.buffer&&(this.effectSend.disconnect(),this._convolver.disconnect(),this._convolver=this.context.createConvolver(),this.connectEffect(this._convolver)),this._convolver.buffer=this._buffer.get()}}),Object.defineProperty(t.Convolver.prototype,"normalize",{get:function(){return this._convolver.normalize},set:function(t){this._convolver.normalize=t}}),t.Convolver.prototype.load=function(t,e){return this._buffer.load(t,function(t){this.buffer=t,e&&e()}.bind(this))},t.Convolver.prototype.dispose=function(){return t.Effect.prototype.dispose.call(this),this._buffer.dispose(),this._buffer=null,this._convolver.disconnect(),this._convolver=null,this},t.Convolver}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(7),i(5),i(13)],void 0===(o=function(t){"use strict";return t.Modulo=function(e){t.SignalBase.call(this),this.createInsOuts(1,0),this._shaper=new t.WaveShaper(Math.pow(2,16)),this._multiply=new t.Multiply,this._subtract=this.output=new t.Subtract,this._modSignal=new t.Signal(e),this.input.fan(this._shaper,this._subtract),this._modSignal.connect(this._multiply,0,0),this._shaper.connect(this._multiply,0,1),this._multiply.connect(this._subtract,0,1),this._setWaveShaper(e)},t.extend(t.Modulo,t.SignalBase),t.Modulo.prototype._setWaveShaper=function(t){this._shaper.setMap(function(e){return Math.floor((e+1e-4)/t)})},Object.defineProperty(t.Modulo.prototype,"value",{get:function(){return this._modSignal.value},set:function(t){this._modSignal.value=t,this._setWaveShaper(t)}}),t.Modulo.prototype.dispose=function(){return t.SignalBase.prototype.dispose.call(this),this._shaper.dispose(),this._shaper=null,this._multiply.dispose(),this._multiply=null,this._subtract.dispose(),this._subtract=null,this._modSignal.dispose(),this._modSignal=null,this},t.Modulo}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(16),i(11),i(62),i(40)],void 0===(o=function(t){return t.Offline=function(e,i){var n=t.context.sampleRate,o=t.context,s=new t.OfflineContext(2,i,n);t.context=s;var r=e(t.Transport),a=null;return a=r&&t.isFunction(r.then)?r.then(function(){return s.render()}):s.render(),t.context=o,a.then(function(e){return new t.Buffer(e)})},t.Offline}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(11)],void 0===(o=function(t){return t.Buffers=function(e){var i=Array.prototype.slice.call(arguments);i.shift();var n=t.defaults(i,["onload","baseUrl"],t.Buffers);for(var o in t.call(this),this._buffers={},this.baseUrl=n.baseUrl,this._loadingCount=0,e)this._loadingCount++,this.add(o,e[o],this._bufferLoaded.bind(this,n.onload))},t.extend(t.Buffers),t.Buffers.defaults={onload:t.noOp,baseUrl:""},t.Buffers.prototype.has=function(t){return this._buffers.hasOwnProperty(t)},t.Buffers.prototype.get=function(t){if(this.has(t))return this._buffers[t];throw new Error("Tone.Buffers: no buffer named "+t)},t.Buffers.prototype._bufferLoaded=function(t){this._loadingCount--,0===this._loadingCount&&t&&t(this)},Object.defineProperty(t.Buffers.prototype,"loaded",{get:function(){var t=!0;for(var e in this._buffers){var i=this.get(e);t=t&&i.loaded}return t}}),t.Buffers.prototype.add=function(e,i,n){return n=t.defaultArg(n,t.noOp),i instanceof t.Buffer?(this._buffers[e]=i,n(this)):i instanceof AudioBuffer?(this._buffers[e]=new t.Buffer(i),n(this)):t.isString(i)&&(this._buffers[e]=new t.Buffer(this.baseUrl+i,n)),this},t.Buffers.prototype.dispose=function(){for(var e in t.prototype.dispose.call(this),this._buffers)this._buffers[e].dispose();return this._buffers=null,this},t.Buffers}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0)],void 0===(o=function(t){"use strict";return t.CtrlPattern=function(){var e=t.defaults(arguments,["values","type"],t.CtrlPattern);t.call(this),this.values=e.values,this.index=0,this._type=null,this._shuffled=null,this._direction=null,this.type=e.type},t.extend(t.CtrlPattern),t.CtrlPattern.Type={Up:"up",Down:"down",UpDown:"upDown",DownUp:"downUp",AlternateUp:"alternateUp",AlternateDown:"alternateDown",Random:"random",RandomWalk:"randomWalk",RandomOnce:"randomOnce"},t.CtrlPattern.defaults={type:t.CtrlPattern.Type.Up,values:[]},Object.defineProperty(t.CtrlPattern.prototype,"value",{get:function(){if(0!==this.values.length){if(1===this.values.length)return this.values[0];this.index=Math.min(this.index,this.values.length-1);var e=this.values[this.index];return this.type===t.CtrlPattern.Type.RandomOnce&&(this.values.length!==this._shuffled.length&&this._shuffleValues(),e=this.values[this._shuffled[this.index]]),e}}}),Object.defineProperty(t.CtrlPattern.prototype,"type",{get:function(){return this._type},set:function(e){this._type=e,this._shuffled=null,this._type===t.CtrlPattern.Type.Up||this._type===t.CtrlPattern.Type.UpDown||this._type===t.CtrlPattern.Type.RandomOnce||this._type===t.CtrlPattern.Type.AlternateUp?this.index=0:this._type!==t.CtrlPattern.Type.Down&&this._type!==t.CtrlPattern.Type.DownUp&&this._type!==t.CtrlPattern.Type.AlternateDown||(this.index=this.values.length-1),this._type===t.CtrlPattern.Type.UpDown||this._type===t.CtrlPattern.Type.AlternateUp?this._direction=t.CtrlPattern.Type.Up:this._type!==t.CtrlPattern.Type.DownUp&&this._type!==t.CtrlPattern.Type.AlternateDown||(this._direction=t.CtrlPattern.Type.Down),this._type===t.CtrlPattern.Type.RandomOnce?this._shuffleValues():this._type===t.CtrlPattern.Random&&(this.index=Math.floor(Math.random()*this.values.length))}}),t.CtrlPattern.prototype.next=function(){var e=this.type;return e===t.CtrlPattern.Type.Up?(this.index++,this.index>=this.values.length&&(this.index=0)):e===t.CtrlPattern.Type.Down?(this.index--,this.index<0&&(this.index=this.values.length-1)):e===t.CtrlPattern.Type.UpDown||e===t.CtrlPattern.Type.DownUp?(this._direction===t.CtrlPattern.Type.Up?this.index++:this.index--,this.index<0?(this.index=1,this._direction=t.CtrlPattern.Type.Up):this.index>=this.values.length&&(this.index=this.values.length-2,this._direction=t.CtrlPattern.Type.Down)):e===t.CtrlPattern.Type.Random?this.index=Math.floor(Math.random()*this.values.length):e===t.CtrlPattern.Type.RandomWalk?Math.random()<.5?(this.index--,this.index=Math.max(this.index,0)):(this.index++,this.index=Math.min(this.index,this.values.length-1)):e===t.CtrlPattern.Type.RandomOnce?(this.index++,this.index>=this.values.length&&(this.index=0,this._shuffleValues())):e===t.CtrlPattern.Type.AlternateUp?(this._direction===t.CtrlPattern.Type.Up?(this.index+=2,this._direction=t.CtrlPattern.Type.Down):(this.index-=1,this._direction=t.CtrlPattern.Type.Up),this.index>=this.values.length&&(this.index=0,this._direction=t.CtrlPattern.Type.Up)):e===t.CtrlPattern.Type.AlternateDown&&(this._direction===t.CtrlPattern.Type.Up?(this.index+=1,this._direction=t.CtrlPattern.Type.Down):(this.index-=2,this._direction=t.CtrlPattern.Type.Up),this.index<0&&(this.index=this.values.length-1,this._direction=t.CtrlPattern.Type.Down)),this.value},t.CtrlPattern.prototype._shuffleValues=function(){var t=[];this._shuffled=[];for(var e=0;e<this.values.length;e++)t[e]=e;for(;t.length>0;){var i=t.splice(Math.floor(t.length*Math.random()),1);this._shuffled.push(i[0])}},t.CtrlPattern.prototype.dispose=function(){this._shuffled=null,this.values=null},t.CtrlPattern}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0)],void 0===(o=function(t){t.supported&&(AudioBuffer.prototype.copyToChannel||(AudioBuffer.prototype.copyToChannel=function(t,e,i){var n=this.getChannelData(e);i=i||0;for(var o=0;o<n.length;o++)n[o+i]=t[o]},AudioBuffer.prototype.copyFromChannel=function(t,e,i){var n=this.getChannelData(e);i=i||0;for(var o=0;o<t.length;o++)t[o]=n[o+i]}))}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(11),i(6),i(3),i(2)],void 0===(o=function(t){return t.OscillatorNode=function(){var e=t.defaults(arguments,["frequency","type"],t.OscillatorNode);t.AudioNode.call(this,e),this.onended=e.onended,this._startTime=-1,this._stopTime=-1,this._gainNode=this.output=new t.Gain(0),this._oscillator=this.context.createOscillator(),this._oscillator.connect(this._gainNode),this.type=e.type,this.frequency=new t.Param({param:this._oscillator.frequency,units:t.Type.Frequency,value:e.frequency}),this.detune=new t.Param({param:this._oscillator.detune,units:t.Type.Cents,value:e.detune}),this._gain=1},t.extend(t.OscillatorNode,t.AudioNode),t.OscillatorNode.defaults={frequency:440,detune:0,type:"sine",onended:t.noOp},Object.defineProperty(t.OscillatorNode.prototype,"state",{get:function(){return this.getStateAtTime(this.now())}}),t.OscillatorNode.prototype.getStateAtTime=function(e){return e=this.toSeconds(e),-1!==this._startTime&&e>=this._startTime&&(-1===this._stopTime||e<=this._stopTime)?t.State.Started:t.State.Stopped},t.OscillatorNode.prototype.start=function(t){if(this.log("start",t),-1!==this._startTime)throw new Error("cannot call OscillatorNode.start more than once");return this._startTime=this.toSeconds(t),this._oscillator.start(this._startTime),this._gainNode.gain.setValueAtTime(1,this._startTime),this},t.OscillatorNode.prototype.setPeriodicWave=function(t){return this._oscillator.setPeriodicWave(t),this},t.OscillatorNode.prototype.stop=function(t){return this.log("stop",t),this.assert(-1!==this._startTime,"'start' must be called before 'stop'"),this.cancelStop(),this._stopTime=this.toSeconds(t),this._stopTime>this._startTime?(this._gainNode.gain.setValueAtTime(0,this._stopTime),this.context.clearTimeout(this._timeout),this._timeout=this.context.setTimeout(function(){this._oscillator.stop(this.now()),this.onended()}.bind(this),this._stopTime-this.context.currentTime)):this._gainNode.gain.cancelScheduledValues(this._startTime),this},t.OscillatorNode.prototype.cancelStop=function(){return-1!==this._startTime&&(this._gainNode.gain.cancelScheduledValues(this._startTime+this.sampleTime),this.context.clearTimeout(this._timeout),this._stopTime=-1),this},Object.defineProperty(t.OscillatorNode.prototype,"type",{get:function(){return this._oscillator.type},set:function(t){this._oscillator.type=t}}),t.OscillatorNode.prototype.dispose=function(){return this.context.clearTimeout(this._timeout),t.AudioNode.prototype.dispose.call(this),this.onended=null,this._oscillator.disconnect(),this._oscillator=null,this._gainNode.dispose(),this._gainNode=null,this.frequency.dispose(),this.frequency=null,this.detune.dispose(),this.detune=null,this},t.OscillatorNode}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(55),i(54)],void 0===(o=function(t){return t.TransportRepeatEvent=function(e,i){t.TransportEvent.call(this,e,i),i=t.defaultArg(i,t.TransportRepeatEvent.defaults),this.duration=t.Ticks(i.duration),this._interval=t.Ticks(i.interval),this._currentId=-1,this._nextId=-1,this._nextTick=this.time,this._boundRestart=this._restart.bind(this),this.Transport.on("start loopStart",this._boundRestart),this._restart()},t.extend(t.TransportRepeatEvent,t.TransportEvent),t.TransportRepeatEvent.defaults={duration:1/0,interval:1},t.TransportRepeatEvent.prototype.invoke=function(e){this._createEvents(e),t.TransportEvent.prototype.invoke.call(this,e)},t.TransportRepeatEvent.prototype._createEvents=function(e){var i=this.Transport.getTicksAtTime(e);i>=this.time&&i>=this._nextTick&&this._nextTick+this._interval<this.time+this.duration&&(this._nextTick+=this._interval,this._currentId=this._nextId,this._nextId=this.Transport.scheduleOnce(this.invoke.bind(this),t.Ticks(this._nextTick)))},t.TransportRepeatEvent.prototype._restart=function(e){this.Transport.clear(this._currentId),this.Transport.clear(this._nextId),this._nextTick=this.time;var i=this.Transport.getTicksAtTime(e);i>this.time&&(this._nextTick=this.time+Math.ceil((i-this.time)/this._interval)*this._interval),this._currentId=this.Transport.scheduleOnce(this.invoke.bind(this),t.Ticks(this._nextTick)),this._nextTick+=this._interval,this._nextId=this.Transport.scheduleOnce(this.invoke.bind(this),t.Ticks(this._nextTick))},t.TransportRepeatEvent.prototype.dispose=function(){return this.Transport.clear(this._currentId),this.Transport.clear(this._nextId),this.Transport.off("start loopStart",this._boundRestart),this._boundCreateEvents=null,t.TransportEvent.prototype.dispose.call(this),this.duration=null,this._interval=null,this},t.TransportRepeatEvent}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(4)],void 0===(o=function(t){"use strict";t.IntervalTimeline=function(){t.call(this),this._root=null,this._length=0},t.extend(t.IntervalTimeline),t.IntervalTimeline.prototype.add=function(i){if(t.isUndef(i.time)||t.isUndef(i.duration))throw new Error("Tone.IntervalTimeline: events must have time and duration parameters");i.time=i.time.valueOf();var n=new e(i.time,i.time+i.duration,i);for(null===this._root?this._root=n:this._root.insert(n),this._length++;null!==n;)n.updateHeight(),n.updateMax(),this._rebalance(n),n=n.parent;return this},t.IntervalTimeline.prototype.remove=function(t){if(null!==this._root){var e=[];this._root.search(t.time,e);for(var i=0;i<e.length;i++){var n=e[i];if(n.event===t){this._removeNode(n),this._length--;break}}}return this},Object.defineProperty(t.IntervalTimeline.prototype,"length",{get:function(){return this._length}}),t.IntervalTimeline.prototype.cancel=function(t){return this.forEachFrom(t,function(t){this.remove(t)}.bind(this)),this},t.IntervalTimeline.prototype._setRoot=function(t){this._root=t,null!==this._root&&(this._root.parent=null)},t.IntervalTimeline.prototype._replaceNodeInParent=function(t,e){null!==t.parent?(t.isLeftChild()?t.parent.left=e:t.parent.right=e,this._rebalance(t.parent)):this._setRoot(e)},t.IntervalTimeline.prototype._removeNode=function(t){if(null===t.left&&null===t.right)this._replaceNodeInParent(t,null);else if(null===t.right)this._replaceNodeInParent(t,t.left);else if(null===t.left)this._replaceNodeInParent(t,t.right);else{var e,i;if(t.getBalance()>0)if(null===t.left.right)(e=t.left).right=t.right,i=e;else{for(e=t.left.right;null!==e.right;)e=e.right;e.parent.right=e.left,i=e.parent,e.left=t.left,e.right=t.right}else if(null===t.right.left)(e=t.right).left=t.left,i=e;else{for(e=t.right.left;null!==e.left;)e=e.left;e.parent=e.parent,e.parent.left=e.right,i=e.parent,e.left=t.left,e.right=t.right}null!==t.parent?t.isLeftChild()?t.parent.left=e:t.parent.right=e:this._setRoot(e),this._rebalance(i)}t.dispose()},t.IntervalTimeline.prototype._rotateLeft=function(t){var e=t.parent,i=t.isLeftChild(),n=t.right;t.right=n.left,n.left=t,null!==e?i?e.left=n:e.right=n:this._setRoot(n)},t.IntervalTimeline.prototype._rotateRight=function(t){var e=t.parent,i=t.isLeftChild(),n=t.left;t.left=n.right,n.right=t,null!==e?i?e.left=n:e.right=n:this._setRoot(n)},t.IntervalTimeline.prototype._rebalance=function(t){var e=t.getBalance();e>1?t.left.getBalance()<0?this._rotateLeft(t.left):this._rotateRight(t):e<-1&&(t.right.getBalance()>0?this._rotateRight(t.right):this._rotateLeft(t))},t.IntervalTimeline.prototype.get=function(t){if(null!==this._root){var e=[];if(this._root.search(t,e),e.length>0){for(var i=e[0],n=1;n<e.length;n++)e[n].low>i.low&&(i=e[n]);return i.event}}return null},t.IntervalTimeline.prototype.forEach=function(t){if(null!==this._root){var e=[];this._root.traverse(function(t){e.push(t)});for(var i=0;i<e.length;i++){var n=e[i].event;n&&t(n)}}return this},t.IntervalTimeline.prototype.forEachAtTime=function(t,e){if(null!==this._root){var i=[];this._root.search(t,i);for(var n=i.length-1;n>=0;n--){var o=i[n].event;o&&e(o)}}return this},t.IntervalTimeline.prototype.forEachFrom=function(t,e){if(null!==this._root){var i=[];this._root.searchAfter(t,i);for(var n=i.length-1;n>=0;n--){e(i[n].event)}}return this},t.IntervalTimeline.prototype.dispose=function(){var t=[];null!==this._root&&this._root.traverse(function(e){t.push(e)});for(var e=0;e<t.length;e++)t[e].dispose();return t=null,this._root=null,this};var e=function(t,e,i){this.event=i,this.low=t,this.high=e,this.max=this.high,this._left=null,this._right=null,this.parent=null,this.height=0};return e.prototype.insert=function(t){t.low<=this.low?null===this.left?this.left=t:this.left.insert(t):null===this.right?this.right=t:this.right.insert(t)},e.prototype.search=function(t,e){t>this.max||(null!==this.left&&this.left.search(t,e),this.low<=t&&this.high>t&&e.push(this),this.low>t||null!==this.right&&this.right.search(t,e))},e.prototype.searchAfter=function(t,e){this.low>=t&&(e.push(this),null!==this.left&&this.left.searchAfter(t,e)),null!==this.right&&this.right.searchAfter(t,e)},e.prototype.traverse=function(t){t(this),null!==this.left&&this.left.traverse(t),null!==this.right&&this.right.traverse(t)},e.prototype.updateHeight=function(){null!==this.left&&null!==this.right?this.height=Math.max(this.left.height,this.right.height)+1:null!==this.right?this.height=this.right.height+1:null!==this.left?this.height=this.left.height+1:this.height=0},e.prototype.updateMax=function(){this.max=this.high,null!==this.left&&(this.max=Math.max(this.max,this.left.max)),null!==this.right&&(this.max=Math.max(this.max,this.right.max))},e.prototype.getBalance=function(){var t=0;return null!==this.left&&null!==this.right?t=this.left.height-this.right.height:null!==this.left?t=this.left.height+1:null!==this.right&&(t=-(this.right.height+1)),t},e.prototype.isLeftChild=function(){return null!==this.parent&&this.parent.left===this},Object.defineProperty(e.prototype,"left",{get:function(){return this._left},set:function(t){this._left=t,null!==t&&(t.parent=this),this.updateHeight(),this.updateMax()}}),Object.defineProperty(e.prototype,"right",{get:function(){return this._right},set:function(t){this._right=t,null!==t&&(t.parent=this),this.updateHeight(),this.updateMax()}}),e.prototype.dispose=function(){this.parent=null,this._left=null,this._right=null,this.event=null},t.IntervalTimeline}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(1)],void 0===(o=function(t){function e(t){return function(e,i){i=this.toSeconds(i),t.apply(this,arguments);var n=this._events.get(i),o=this._events.previousEvent(n),s=this._getTicksUntilEvent(o,i);return n.ticks=Math.max(s,0),this}}return t.TickSignal=function(e){e=t.defaultArg(e,1),t.Signal.call(this,{units:t.Type.Ticks,value:e}),this._events.memory=1/0,this.cancelScheduledValues(0),this._events.add({type:t.Param.AutomationType.SetValue,time:0,value:e})},t.extend(t.TickSignal,t.Signal),t.TickSignal.prototype.setValueAtTime=e(t.Signal.prototype.setValueAtTime),t.TickSignal.prototype.linearRampToValueAtTime=e(t.Signal.prototype.linearRampToValueAtTime),t.TickSignal.prototype.setTargetAtTime=function(t,e,i){e=this.toSeconds(e),this.setRampPoint(e),t=this._fromUnits(t);for(var n=this._events.get(e),o=Math.round(Math.max(1/i,1)),s=0;s<=o;s++){var r=i*s+e,a=this._exponentialApproach(n.time,n.value,t,i,r);this.linearRampToValueAtTime(this._toUnits(a),r)}return this},t.TickSignal.prototype.exponentialRampToValueAtTime=function(t,e){e=this.toSeconds(e),t=this._fromUnits(t);var i=this._events.get(e);null===i&&(i={value:this._initialValue,time:0});for(var n=Math.round(Math.max(10*(e-i.time),1)),o=(e-i.time)/n,s=0;s<=n;s++){var r=o*s+i.time,a=this._exponentialInterpolate(i.time,i.value,e,t,r);this.linearRampToValueAtTime(this._toUnits(a),r)}return this},t.TickSignal.prototype._getTicksUntilEvent=function(e,i){if(null===e)e={ticks:0,time:0};else if(t.isUndef(e.ticks)){var n=this._events.previousEvent(e);e.ticks=this._getTicksUntilEvent(n,e.time)}var o=this.getValueAtTime(e.time),s=this.getValueAtTime(i);return this._events.get(i).time===i&&this._events.get(i).type===t.Param.AutomationType.SetValue&&(s=this.getValueAtTime(i-this.sampleTime)),.5*(i-e.time)*(o+s)+e.ticks},t.TickSignal.prototype.getTicksAtTime=function(t){t=this.toSeconds(t);var e=this._events.get(t);return Math.max(this._getTicksUntilEvent(e,t),0)},t.TickSignal.prototype.getDurationOfTicks=function(t,e){e=this.toSeconds(e);var i=this.getTicksAtTime(e);return this.getTimeOfTick(i+t)-e},t.TickSignal.prototype.getTimeOfTick=function(e){var i=this._events.get(e,"ticks"),n=this._events.getAfter(e,"ticks");if(i&&i.ticks===e)return i.time;if(i&&n&&n.type===t.Param.AutomationType.Linear&&i.value!==n.value){var o=this.getValueAtTime(i.time),s=(this.getValueAtTime(n.time)-o)/(n.time-i.time),r=Math.sqrt(Math.pow(o,2)-2*s*(i.ticks-e)),a=(-o+r)/s;return(a>0?a:(-o-r)/s)+i.time}return i?0===i.value?1/0:i.time+(e-i.ticks)/i.value:e/this._initialValue},t.TickSignal.prototype.ticksToTime=function(e,i){return i=this.toSeconds(i),new t.Time(this.getDurationOfTicks(e,i))},t.TickSignal.prototype.timeToTicks=function(e,i){i=this.toSeconds(i),e=this.toSeconds(e);var n=this.getTicksAtTime(i),o=this.getTicksAtTime(i+e);return new t.Ticks(o-n)},t.TickSignal}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(56),i(33),i(35),i(20)],void 0===(o=function(t){"use strict";return t.Clock=function(){var e=t.defaults(arguments,["callback","frequency"],t.Clock);t.Emitter.call(this),this.callback=e.callback,this._nextTick=0,this._tickSource=new t.TickSource(e.frequency),this._lastUpdate=0,this.frequency=this._tickSource.frequency,this._readOnly("frequency"),this._state=new t.TimelineState(t.State.Stopped),this._state.setStateAtTime(t.State.Stopped,0),this._boundLoop=this._loop.bind(this),this.context.on("tick",this._boundLoop)},t.extend(t.Clock,t.Emitter),t.Clock.defaults={callback:t.noOp,frequency:1},Object.defineProperty(t.Clock.prototype,"state",{get:function(){return this._state.getValueAtTime(this.now())}}),t.Clock.prototype.start=function(e,i){return this.context.resume(),e=this.toSeconds(e),this._state.getValueAtTime(e)!==t.State.Started&&(this._state.setStateAtTime(t.State.Started,e),this._tickSource.start(e,i),e<this._lastUpdate&&this.emit("start",e,i)),this},t.Clock.prototype.stop=function(e){return e=this.toSeconds(e),this._state.cancel(e),this._state.setStateAtTime(t.State.Stopped,e),this._tickSource.stop(e),e<this._lastUpdate&&this.emit("stop",e),this},t.Clock.prototype.pause=function(e){return e=this.toSeconds(e),this._state.getValueAtTime(e)===t.State.Started&&(this._state.setStateAtTime(t.State.Paused,e),this._tickSource.pause(e),e<this._lastUpdate&&this.emit("pause",e)),this},Object.defineProperty(t.Clock.prototype,"ticks",{get:function(){return Math.ceil(this.getTicksAtTime(this.now()))},set:function(t){this._tickSource.ticks=t}}),Object.defineProperty(t.Clock.prototype,"seconds",{get:function(){return this._tickSource.seconds},set:function(t){this._tickSource.seconds=t}}),t.Clock.prototype.getSecondsAtTime=function(t){return this._tickSource.getSecondsAtTime(t)},t.Clock.prototype.setTicksAtTime=function(t,e){return this._tickSource.setTicksAtTime(t,e),this},t.Clock.prototype.getTicksAtTime=function(t){return this._tickSource.getTicksAtTime(t)},t.Clock.prototype.nextTickTime=function(t,e){e=this.toSeconds(e);var i=this.getTicksAtTime(e);return this._tickSource.getTimeOfTick(i+t,e)},t.Clock.prototype._loop=function(){var e=this._lastUpdate,i=this.now();this._lastUpdate=i,e!==i&&(this._state.forEachBetween(e,i,function(e){switch(e.state){case t.State.Started:var i=this._tickSource.getTicksAtTime(e.time);this.emit("start",e.time,i);break;case t.State.Stopped:0!==e.time&&this.emit("stop",e.time);break;case t.State.Paused:this.emit("pause",e.time)}}.bind(this)),this._tickSource.forEachTickBetween(e,i,function(t,e){this.callback(t,e)}.bind(this)))},t.Clock.prototype.getStateAtTime=function(t){return t=this.toSeconds(t),this._state.getValueAtTime(t)},t.Clock.prototype.dispose=function(){t.Emitter.prototype.dispose.call(this),this.context.off("tick",this._boundLoop),this._writable("frequency"),this._tickSource.dispose(),this._tickSource=null,this.frequency=null,this._boundLoop=null,this._nextTick=1/0,this.callback=null,this._state.dispose(),this._state=null},t.Clock}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(1),i(5),i(7)],void 0===(o=function(t){"use strict";return t.GreaterThanZero=function(){t.SignalBase.call(this),this._thresh=this.output=new t.WaveShaper(function(t){return t<=0?0:1},127),this._scale=this.input=new t.Multiply(1e4),this._scale.connect(this._thresh)},t.extend(t.GreaterThanZero,t.SignalBase),t.GreaterThanZero.prototype.dispose=function(){return t.SignalBase.prototype.dispose.call(this),this._scale.dispose(),this._scale=null,this._thresh.dispose(),this._thresh=null,this},t.GreaterThanZero}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(87),i(13),i(1)],void 0===(o=function(t){"use strict";return t.GreaterThan=function(e){t.Signal.call(this),this.createInsOuts(2,0),this._param=this.input[0]=new t.Subtract(e),this.input[1]=this._param.input[1],this._gtz=this.output=new t.GreaterThanZero,this._param.connect(this._gtz),this.proxy=!1},t.extend(t.GreaterThan,t.Signal),t.GreaterThan.prototype.dispose=function(){return t.Signal.prototype.dispose.call(this),this._gtz.dispose(),this._gtz=null,this},t.GreaterThan}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(47),i(26)],void 0===(o=function(t){"use strict";return t.ScaledEnvelope=function(){var e=t.defaults(arguments,["attack","decay","sustain","release"],t.Envelope);t.Envelope.call(this,e),e=t.defaultArg(e,t.ScaledEnvelope.defaults),this._exp=this.output=new t.Pow(e.exponent),this._scale=this.output=new t.Scale(e.min,e.max),this._sig.chain(this._exp,this._scale)},t.extend(t.ScaledEnvelope,t.Envelope),t.ScaledEnvelope.defaults={min:0,max:1,exponent:1},Object.defineProperty(t.ScaledEnvelope.prototype,"min",{get:function(){return this._scale.min},set:function(t){this._scale.min=t}}),Object.defineProperty(t.ScaledEnvelope.prototype,"max",{get:function(){return this._scale.max},set:function(t){this._scale.max=t}}),Object.defineProperty(t.ScaledEnvelope.prototype,"exponent",{get:function(){return this._exp.value},set:function(t){this._exp.value=t}}),t.ScaledEnvelope.prototype.dispose=function(){return t.Envelope.prototype.dispose.call(this),this._scale.dispose(),this._scale=null,this._exp.dispose(),this._exp=null,this},t.ScaledEnvelope}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(7),i(36)],void 0===(o=function(t){"use strict";return t.Abs=function(){t.SignalBase.call(this),this._abs=this.input=this.output=new t.WaveShaper(function(t){return Math.abs(t)<.001?0:Math.abs(t)},1024)},t.extend(t.Abs,t.SignalBase),t.Abs.prototype.dispose=function(){return t.SignalBase.prototype.dispose.call(this),this._abs.dispose(),this._abs=null,this},t.Abs}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(3),i(2)],void 0===(o=function(t){return t.Solo=function(){var e=t.defaults(arguments,["solo"],t.Solo);t.AudioNode.call(this),this.input=this.output=new t.Gain,this._soloBind=this._soloed.bind(this),this.context.on("solo",this._soloBind),this.solo=e.solo},t.extend(t.Solo,t.AudioNode),t.Solo.defaults={solo:!1},Object.defineProperty(t.Solo.prototype,"solo",{get:function(){return this._isSoloed()},set:function(t){t?this._addSolo():this._removeSolo(),this.context.emit("solo",this)}}),Object.defineProperty(t.Solo.prototype,"muted",{get:function(){return 0===this.input.gain.value}}),t.Solo.prototype._addSolo=function(){t.isArray(this.context._currentSolo)||(this.context._currentSolo=[]),this._isSoloed()||this.context._currentSolo.push(this)},t.Solo.prototype._removeSolo=function(){if(this._isSoloed()){var t=this.context._currentSolo.indexOf(this);this.context._currentSolo.splice(t,1)}},t.Solo.prototype._isSoloed=function(){return!!t.isArray(this.context._currentSolo)&&(0!==this.context._currentSolo.length&&-1!==this.context._currentSolo.indexOf(this))},t.Solo.prototype._noSolos=function(){return!t.isArray(this.context._currentSolo)||0===this.context._currentSolo.length},t.Solo.prototype._soloed=function(){this._isSoloed()?this.input.gain.value=1:this._noSolos()?this.input.gain.value=1:this.input.gain.value=0},t.Solo.prototype.dispose=function(){return this.context.off("solo",this._soloBind),this._removeSolo(),this._soloBind=null,t.AudioNode.prototype.dispose.call(this),this},t.Solo}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(7),i(10),i(28),i(19),i(3),i(1),i(20)],void 0===(o=function(t){if(t.supported&&!t.global.AudioContext.prototype.createStereoPanner){var e=function(e){this.context=e,this.pan=new t.Signal(0,t.Type.AudioRange);var i=new t.WaveShaper(function(e){return t.equalPowerScale((e+1)/2)},4096),n=new t.WaveShaper(function(e){return t.equalPowerScale(1-(e+1)/2)},4096),o=new t.Gain,s=new t.Gain,r=this.input=new t.Split;r._splitter.channelCountMode="explicit",(new t.Zero).fan(i,n);var a=this.output=new t.Merge;r.left.chain(o,a.left),r.right.chain(s,a.right),this.pan.chain(n,o.gain),this.pan.chain(i,s.gain)};e.prototype.disconnect=function(){this.output.disconnect.apply(this.output,arguments)},e.prototype.connect=function(){this.output.connect.apply(this.output,arguments)},AudioContext.prototype.createStereoPanner=function(){return new e(this)},t.Context.prototype.createStereoPanner=function(){return new e(this)}}}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(7)],void 0===(o=function(t){"use strict";return t.EqualPowerGain=function(){t.SignalBase.call(this),this._eqPower=this.input=this.output=new t.WaveShaper(function(e){return Math.abs(e)<.001?0:t.equalPowerScale(e)}.bind(this),4096)},t.extend(t.EqualPowerGain,t.SignalBase),t.EqualPowerGain.prototype.dispose=function(){return t.SignalBase.prototype.dispose.call(this),this._eqPower.dispose(),this._eqPower=null,this},t.EqualPowerGain}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(5),i(1)],void 0===(o=function(t){"use strict";return t.Negate=function(){t.SignalBase.call(this),this._multiply=this.input=this.output=new t.Multiply(-1)},t.extend(t.Negate,t.SignalBase),t.Negate.prototype.dispose=function(){return t.SignalBase.prototype.dispose.call(this),this._multiply.dispose(),this._multiply=null,this},t.Negate}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(60),i(27),i(2)],void 0===(o=function(t){"use strict";return t.PanVol=function(){var e=t.defaults(arguments,["pan","volume"],t.PanVol);t.AudioNode.call(this),this._panner=this.input=new t.Panner(e.pan),this.pan=this._panner.pan,this._volume=this.output=new t.Volume(e.volume),this.volume=this._volume.volume,this._panner.connect(this._volume),this.mute=e.mute,this._readOnly(["pan","volume"])},t.extend(t.PanVol,t.AudioNode),t.PanVol.defaults={pan:0,volume:0,mute:!1},Object.defineProperty(t.PanVol.prototype,"mute",{get:function(){return this._volume.mute},set:function(t){this._volume.mute=t}}),t.PanVol.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._writable(["pan","volume"]),this._panner.dispose(),this._panner=null,this.pan=null,this._volume.dispose(),this._volume=null,this.volume=null,this},t.PanVol}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(34)],void 0===(o=function(t){t.supported&&(AnalyserNode.prototype.getFloatTimeDomainData||(AnalyserNode.prototype.getFloatTimeDomainData=function(t){var e=new Uint8Array(t.length);this.getByteTimeDomainData(e);for(var i=0;i<e.length;i++)t[i]=(e[i]-128)/128}))}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(34),i(63),i(20),i(3)],void 0===(o=function(t){if(t.supported&&!t.global.AudioContext.prototype.createConstantSource){var e=function(t){this.context=t;for(var e=t.createBuffer(1,128,t.sampleRate),i=e.getChannelData(0),n=0;n<i.length;n++)i[n]=1;this._bufferSource=t.createBufferSource(),this._bufferSource.channelCount=1,this._bufferSource.channelCountMode="explicit",this._bufferSource.buffer=e,this._bufferSource.loop=!0;var o=this._output=t.createGain();this.offset=o.gain,this._bufferSource.connect(o)};e.prototype.start=function(t){return this._bufferSource.start(t),this},e.prototype.stop=function(t){return this._bufferSource.stop(t),this},e.prototype.connect=function(){return this._output.connect.apply(this._output,arguments),this},e.prototype.disconnect=function(){return this._output.disconnect.apply(this._output,arguments),this},AudioContext.prototype.createConstantSource=function(){return new e(this)},t.Context.prototype.createConstantSource=function(){return new e(this)}}}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(34)],void 0===(o=function(t){if(t.supported&&!t.global.AudioContext.prototype._native_createWaveShaper){var e=navigator.userAgent.toLowerCase();if(e.includes("safari")&&!e.includes("chrome")){var i=function(t){for(var e in this._internalNode=this.input=this.output=t._native_createWaveShaper(),this._curve=null,this._internalNode)this._defineProperty(this._internalNode,e)};Object.defineProperty(i.prototype,"curve",{get:function(){return this._curve},set:function(t){this._curve=t;var e=new Float32Array(t.length+1);e.set(t,1),e[0]=t[0],this._internalNode.curve=e}}),i.prototype._defineProperty=function(e,i){t.isUndef(this[i])&&Object.defineProperty(this,i,{get:function(){return"function"==typeof e[i]?e[i].bind(e):e[i]},set:function(t){e[i]=t}})},t.global.AudioContext.prototype._native_createWaveShaper=t.global.AudioContext.prototype.createWaveShaper,t.global.AudioContext.prototype.createWaveShaper=function(){return new i(this)}}}}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(46)],void 0===(o=function(t){return t.Midi=function(e,i){if(!(this instanceof t.Midi))return new t.Midi(e,i);t.Frequency.call(this,e,i)},t.extend(t.Midi,t.Frequency),t.Midi.prototype._defaultUnits="midi",t.Midi.prototype._frequencyToUnits=function(e){return t.Frequency.ftom(t.Frequency.prototype._frequencyToUnits.call(this,e))},t.Midi.prototype._ticksToUnits=function(e){return t.Frequency.ftom(t.Frequency.prototype._ticksToUnits.call(this,e))},t.Midi.prototype._beatsToUnits=function(e){return t.Frequency.ftom(t.Frequency.prototype._beatsToUnits.call(this,e))},t.Midi.prototype._secondsToUnits=function(e){return t.Frequency.ftom(t.Frequency.prototype._secondsToUnits.call(this,e))},t.Midi.prototype.toMidi=function(){return this.valueOf()},t.Midi.prototype.toFrequency=function(){return t.Frequency.mtof(this.toMidi())},t.Midi.prototype.transpose=function(t){return new this.constructor(this.toMidi()+t)},t.Midi}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(27),i(2)],void 0===(o=function(t){"use strict";return t.UserMedia=function(){var e=t.defaults(arguments,["volume"],t.UserMedia);t.AudioNode.call(this),this._mediaStream=null,this._stream=null,this._device=null,this._volume=this.output=new t.Volume(e.volume),this.volume=this._volume.volume,this._readOnly("volume"),this.mute=e.mute},t.extend(t.UserMedia,t.AudioNode),t.UserMedia.defaults={volume:0,mute:!1},t.UserMedia.prototype.open=function(e){return this.state===t.State.Started&&this.close(),t.UserMedia.enumerateDevices().then(function(i){var n;if(t.isNumber(e))n=i[e];else if(!(n=i.find(function(t){return t.label===e||t.deviceId===e}))&&i.length>0)n=i[0];else if(!n&&t.isDefined(e))throw new Error("Tone.UserMedia: no matching device: "+e);this._device=n;var o={audio:{echoCancellation:!1,sampleRate:this.context.sampleRate,noiseSuppression:!1,mozNoiseSuppression:!1}};return n&&(o.audio.deviceId=n.deviceId),navigator.mediaDevices.getUserMedia(o).then(function(t){return this._stream||(this._stream=t,this._mediaStream=this.context.createMediaStreamSource(t),this._mediaStream.connect(this.output)),this}.bind(this))}.bind(this))},t.UserMedia.prototype.close=function(){return this._stream&&(this._stream.getAudioTracks().forEach(function(t){t.stop()}),this._stream=null,this._mediaStream.disconnect(),this._mediaStream=null),this._device=null,this},t.UserMedia.enumerateDevices=function(){return navigator.mediaDevices.enumerateDevices().then(function(t){return t.filter(function(t){return"audioinput"===t.kind})})},Object.defineProperty(t.UserMedia.prototype,"state",{get:function(){return this._stream&&this._stream.active?t.State.Started:t.State.Stopped}}),Object.defineProperty(t.UserMedia.prototype,"deviceId",{get:function(){if(this._device)return this._device.deviceId}}),Object.defineProperty(t.UserMedia.prototype,"groupId",{get:function(){if(this._device)return this._device.groupId}}),Object.defineProperty(t.UserMedia.prototype,"label",{get:function(){if(this._device)return this._device.label}}),Object.defineProperty(t.UserMedia.prototype,"mute",{get:function(){return this._volume.mute},set:function(t){this._volume.mute=t}}),t.UserMedia.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this.close(),this._writable("volume"),this._volume.dispose(),this._volume=null,this.volume=null,this},Object.defineProperty(t.UserMedia,"supported",{get:function(){return t.isDefined(navigator.mediaDevices)&&t.isFunction(navigator.mediaDevices.getUserMedia)}}),t.UserMedia}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(67),i(27),i(2)],void 0===(o=function(t){"use strict";return t.Players=function(e){var i=Array.prototype.slice.call(arguments);i.shift();var n=t.defaults(i,["onload"],t.Players);for(var o in t.AudioNode.call(this,n),this._volume=this.output=new t.Volume(n.volume),this.volume=this._volume.volume,this._readOnly("volume"),this._volume.output.output.channelCount=2,this._volume.output.output.channelCountMode="explicit",this.mute=n.mute,this._players={},this._loadingCount=0,this._fadeIn=n.fadeIn,this._fadeOut=n.fadeOut,e)this._loadingCount++,this.add(o,e[o],this._bufferLoaded.bind(this,n.onload))},t.extend(t.Players,t.AudioNode),t.Players.defaults={volume:0,mute:!1,onload:t.noOp,fadeIn:0,fadeOut:0},t.Players.prototype._bufferLoaded=function(t){this._loadingCount--,0===this._loadingCount&&t&&t(this)},Object.defineProperty(t.Players.prototype,"mute",{get:function(){return this._volume.mute},set:function(t){this._volume.mute=t}}),Object.defineProperty(t.Players.prototype,"fadeIn",{get:function(){return this._fadeIn},set:function(t){this._fadeIn=t,this._forEach(function(e){e.fadeIn=t})}}),Object.defineProperty(t.Players.prototype,"fadeOut",{get:function(){return this._fadeOut},set:function(t){this._fadeOut=t,this._forEach(function(e){e.fadeOut=t})}}),Object.defineProperty(t.Players.prototype,"state",{get:function(){var e=!1;return this._forEach(function(i){e=e||i.state===t.State.Started}),e?t.State.Started:t.State.Stopped}}),t.Players.prototype.has=function(t){return this._players.hasOwnProperty(t)},t.Players.prototype.get=function(t){if(this.has(t))return this._players[t];throw new Error("Tone.Players: no player named "+t)},t.Players.prototype._forEach=function(t){for(var e in this._players)t(this._players[e],e);return this},Object.defineProperty(t.Players.prototype,"loaded",{get:function(){var t=!0;return this._forEach(function(e){t=t&&e.loaded}),t}}),t.Players.prototype.add=function(e,i,n){return this._players[e]=new t.Player(i,n).connect(this.output),this._players[e].fadeIn=this._fadeIn,this._players[e].fadeOut=this._fadeOut,this},t.Players.prototype.stopAll=function(t){this._forEach(function(e){e.stop(t)})},t.Players.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._volume.dispose(),this._volume=null,this._writable("volume"),this.volume=null,this.output=null,this._forEach(function(t){t.dispose()}),this._players=null,this},t.Players}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(6),i(11),i(31)],void 0===(o=function(t){return t.GrainPlayer=function(){var e=t.defaults(arguments,["url","onload"],t.GrainPlayer);t.Source.call(this,e),this.buffer=new t.Buffer(e.url,e.onload),this._clock=new t.Clock(this._tick.bind(this),e.grainSize),this._loopStart=0,this._loopEnd=0,this._activeSources=[],this._playbackRate=e.playbackRate,this._grainSize=e.grainSize,this._overlap=e.overlap,this.detune=e.detune,this.overlap=e.overlap,this.loop=e.loop,this.playbackRate=e.playbackRate,this.grainSize=e.grainSize,this.loopStart=e.loopStart,this.loopEnd=e.loopEnd,this.reverse=e.reverse,this._clock.on("stop",this._onstop.bind(this))},t.extend(t.GrainPlayer,t.Source),t.GrainPlayer.defaults={onload:t.noOp,overlap:.1,grainSize:.2,playbackRate:1,detune:0,loop:!1,loopStart:0,loopEnd:0,reverse:!1},t.GrainPlayer.prototype._start=function(e,i,n){i=t.defaultArg(i,0),i=this.toSeconds(i),e=this.toSeconds(e),this._offset=i,this._clock.start(e),n&&this.stop(e+this.toSeconds(n))},t.GrainPlayer.prototype._stop=function(t){this._clock.stop(t)},t.GrainPlayer.prototype._onstop=function(t){this._activeSources.forEach(function(e){e.fadeOut=0,e.stop(t)})},t.GrainPlayer.prototype._tick=function(e){if(!this.loop&&this._offset>this.buffer.duration)this.stop(e);else{var i=this._offset<this._overlap?0:this._overlap,n=new t.BufferSource({buffer:this.buffer,fadeIn:i,fadeOut:this._overlap,loop:this.loop,loopStart:this._loopStart,loopEnd:this._loopEnd,playbackRate:t.intervalToFrequencyRatio(this.detune/100)}).connect(this.output);n.start(e,this._offset),this._offset+=this.grainSize,n.stop(e+this.grainSize/this.playbackRate),this._activeSources.push(n),n.onended=function(){var t=this._activeSources.indexOf(n);-1!==t&&this._activeSources.splice(t,1)}.bind(this)}},Object.defineProperty(t.GrainPlayer.prototype,"playbackRate",{get:function(){return this._playbackRate},set:function(t){this._playbackRate=t,this.grainSize=this._grainSize}}),Object.defineProperty(t.GrainPlayer.prototype,"loopStart",{get:function(){return this._loopStart},set:function(t){this._loopStart=this.toSeconds(t)}}),Object.defineProperty(t.GrainPlayer.prototype,"loopEnd",{get:function(){return this._loopEnd},set:function(t){this._loopEnd=this.toSeconds(t)}}),Object.defineProperty(t.GrainPlayer.prototype,"reverse",{get:function(){return this.buffer.reverse},set:function(t){this.buffer.reverse=t}}),Object.defineProperty(t.GrainPlayer.prototype,"grainSize",{get:function(){return this._grainSize},set:function(t){this._grainSize=this.toSeconds(t),this._clock.frequency.value=this._playbackRate/this._grainSize}}),Object.defineProperty(t.GrainPlayer.prototype,"overlap",{get:function(){return this._overlap},set:function(t){this._overlap=this.toSeconds(t)}}),Object.defineProperty(t.GrainPlayer.prototype,"loaded",{get:function(){return this.buffer.loaded}}),t.GrainPlayer.prototype.dispose=function(){return t.Source.prototype.dispose.call(this),this.buffer.dispose(),this.buffer=null,this._clock.dispose(),this._clock=null,this._activeSources.forEach(function(t){t.dispose()}),this._activeSources=null,this},t.GrainPlayer}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(16),i(1),i(45)],void 0===(o=function(t){return t.TransportTimelineSignal=function(){t.Signal.apply(this,arguments),this.output=this._outputSig=new t.Signal(this._initialValue),this._lastVal=this.value,this._synced=t.Transport.scheduleRepeat(this._onTick.bind(this),"1i"),this._bindAnchorValue=this._anchorValue.bind(this),t.Transport.on("start stop pause",this._bindAnchorValue),this._events.memory=1/0},t.extend(t.TransportTimelineSignal,t.Signal),t.TransportTimelineSignal.prototype._onTick=function(e){var i=this.getValueAtTime(t.Transport.seconds);this._lastVal!==i&&(this._lastVal=i,this._outputSig.linearRampToValueAtTime(i,e))},t.TransportTimelineSignal.prototype._anchorValue=function(e){var i=this.getValueAtTime(t.Transport.seconds);return this._lastVal=i,this._outputSig.cancelScheduledValues(e),this._outputSig.setValueAtTime(i,e),this},t.TransportTimelineSignal.prototype.getValueAtTime=function(e){return e=t.TransportTime(e),t.Signal.prototype.getValueAtTime.call(this,e)},t.TransportTimelineSignal.prototype.setValueAtTime=function(e,i){return i=t.TransportTime(i),t.Signal.prototype.setValueAtTime.call(this,e,i),this},t.TransportTimelineSignal.prototype.linearRampToValueAtTime=function(e,i){return i=t.TransportTime(i),t.Signal.prototype.linearRampToValueAtTime.call(this,e,i),this},t.TransportTimelineSignal.prototype.exponentialRampToValueAtTime=function(e,i){return i=t.TransportTime(i),t.Signal.prototype.exponentialRampToValueAtTime.call(this,e,i),this},t.TransportTimelineSignal.prototype.setTargetAtTime=function(e,i,n){return i=t.TransportTime(i),t.Signal.prototype.setTargetAtTime.call(this,e,i,n),this},t.TransportTimelineSignal.prototype.cancelScheduledValues=function(e){return e=t.TransportTime(e),t.Signal.prototype.cancelScheduledValues.call(this,e),this},t.TransportTimelineSignal.prototype.setValueCurveAtTime=function(e,i,n,o){return i=t.TransportTime(i),n=t.TransportTime(n),t.Signal.prototype.setValueCurveAtTime.call(this,e,i,n,o),this},t.TransportTimelineSignal.prototype.cancelAndHoldAtTime=function(e){return t.Signal.prototype.cancelAndHoldAtTime.call(this,t.TransportTime(e))},t.TransportTimelineSignal.prototype.dispose=function(){t.Transport.clear(this._synced),t.Transport.off("start stop pause",this._syncedCallback),this._events.cancel(0),t.Signal.prototype.dispose.call(this),this._outputSig.dispose(),this._outputSig=null},t.TransportTimelineSignal}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(29),i(5)],void 0===(o=function(t){"use strict";return t.Normalize=function(e,i){t.SignalBase.call(this),this._inputMin=t.defaultArg(e,0),this._inputMax=t.defaultArg(i,1),this._sub=this.input=new t.Add(0),this._div=this.output=new t.Multiply(1),this._sub.connect(this._div),this._setRange()},t.extend(t.Normalize,t.SignalBase),Object.defineProperty(t.Normalize.prototype,"min",{get:function(){return this._inputMin},set:function(t){this._inputMin=t,this._setRange()}}),Object.defineProperty(t.Normalize.prototype,"max",{get:function(){return this._inputMax},set:function(t){this._inputMax=t,this._setRange()}}),t.Normalize.prototype._setRange=function(){this._sub.value=-this._inputMin,this._div.value=1/(this._inputMax-this._inputMin)},t.Normalize.prototype.dispose=function(){return t.SignalBase.prototype.dispose.call(this),this._sub.dispose(),this._sub=null,this._div.dispose(),this._div=null,this},t.Normalize}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(7),i(1)],void 0===(o=function(t){"use strict";return t.GainToAudio=function(){t.SignalBase.call(this),this._norm=this.input=this.output=new t.WaveShaper(function(t){return 2*Math.abs(t)-1})},t.extend(t.GainToAudio,t.SignalBase),t.GainToAudio.prototype.dispose=function(){return t.SignalBase.prototype.dispose.call(this),this._norm.dispose(),this._norm=null,this},t.GainToAudio}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0)],void 0===(o=function(t){t.supported&&(OscillatorNode.prototype.setPeriodicWave||(OscillatorNode.prototype.setPeriodicWave=OscillatorNode.prototype.setWaveTable),AudioContext.prototype.createPeriodicWave||(AudioContext.prototype.createPeriodicWave=AudioContext.prototype.createWaveTable))}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(21),i(79),i(31)],void 0===(o=function(t){return t.Sampler=function(e){var i=Array.prototype.slice.call(arguments);i.shift();var n=t.defaults(i,["onload","baseUrl"],t.Sampler);t.Instrument.call(this,n);var o={};for(var s in e)if(t.isNote(s)){o[t.Frequency(s).toMidi()]=e[s]}else{if(isNaN(parseFloat(s)))throw new Error("Tone.Sampler: url keys must be the note's pitch");o[s]=e[s]}this._buffers=new t.Buffers(o,n.onload,n.baseUrl),this._activeSources={},this.attack=n.attack,this.release=n.release,this.curve=n.curve},t.extend(t.Sampler,t.Instrument),t.Sampler.defaults={attack:0,release:.1,onload:t.noOp,baseUrl:"",curve:"exponential"},t.Sampler.prototype._findClosest=function(t){for(var e=0;e<96;){if(this._buffers.has(t+e))return-e;if(this._buffers.has(t-e))return e;e++}return null},t.Sampler.prototype.triggerAttack=function(e,i,n){this.log("triggerAttack",e,i,n),Array.isArray(e)||(e=[e]);for(var o=0;o<e.length;o++){var s=t.Frequency(e[o]).toMidi(),r=this._findClosest(s);if(null!==r){var a=s-r,l=this._buffers.get(a),h=t.intervalToFrequencyRatio(r),u=new t.BufferSource({buffer:l,playbackRate:h,fadeIn:this.attack,fadeOut:this.release,curve:this.curve}).connect(this.output);u.start(i,0,l.duration/h,n),t.isArray(this._activeSources[s])||(this._activeSources[s]=[]),this._activeSources[s].push(u),u.onended=function(){if(this._activeSources&&this._activeSources[s]){var t=this._activeSources[s].indexOf(u);-1!==t&&this._activeSources[s].splice(t,1)}}.bind(this)}}return this},t.Sampler.prototype.triggerRelease=function(e,i){this.log("triggerRelease",e,i),Array.isArray(e)||(e=[e]);for(var n=0;n<e.length;n++){var o=t.Frequency(e[n]).toMidi();if(this._activeSources[o]&&this._activeSources[o].length){var s=this._activeSources[o].shift();i=this.toSeconds(i),s.stop(i)}}return this},t.Sampler.prototype.releaseAll=function(t){for(var e in t=this.toSeconds(t),this._activeSources)for(var i=this._activeSources[e];i.length;){i.shift().stop(t)}return this},t.Sampler.prototype.sync=function(){return this._syncMethod("triggerAttack",1),this._syncMethod("triggerRelease",1),this},t.Sampler.prototype.triggerAttackRelease=function(e,i,n,o){if(n=this.toSeconds(n),this.triggerAttack(e,n,o),t.isArray(i)&&t.isArray(e))for(var s=0;s<e.length;s++){var r=i[Math.min(s,i.length-1)];this.triggerRelease(e[s],n+this.toSeconds(r))}else this.triggerRelease(e,n+this.toSeconds(i));return this},t.Sampler.prototype.add=function(e,i,n){if(t.isNote(e)){var o=t.Frequency(e).toMidi();this._buffers.add(o,i,n)}else{if(isNaN(parseFloat(e)))throw new Error("Tone.Sampler: note must be the note's pitch. Instead got "+e);this._buffers.add(e,i,n)}},Object.defineProperty(t.Sampler.prototype,"loaded",{get:function(){return this._buffers.loaded}}),t.Sampler.prototype.dispose=function(){for(var e in t.Instrument.prototype.dispose.call(this),this._buffers.dispose(),this._buffers=null,this._activeSources)this._activeSources[e].forEach(function(t){t.dispose()});return this._activeSources=null,this},t.Sampler}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(38),i(6)],void 0===(o=function(t){"use strict";return t.PolySynth=function(){var e=t.defaults(arguments,["polyphony","voice"],t.PolySynth);t.Instrument.call(this,e),(e=t.defaultArg(e,t.Instrument.defaults)).polyphony=Math.min(t.PolySynth.MAX_POLYPHONY,e.polyphony),this.voices=new Array(e.polyphony),this.assert(e.polyphony>0,"polyphony must be greater than 0"),this.detune=new t.Signal(e.detune,t.Type.Cents),this._readOnly("detune");for(var i=0;i<e.polyphony;i++){var n=new e.voice(arguments[2],arguments[3]);if(!(n instanceof t.Monophonic))throw new Error("Synth constructor must be instance of Tone.Monophonic");this.voices[i]=n,n.index=i,n.connect(this.output),n.hasOwnProperty("detune")&&this.detune.connect(n.detune)}},t.extend(t.PolySynth,t.Instrument),t.PolySynth.defaults={polyphony:4,volume:0,detune:0,voice:t.Synth},t.PolySynth.prototype._getClosestVoice=function(e,i){var n=this.voices.find(function(n){if(Math.abs(n.frequency.getValueAtTime(e)-t.Frequency(i))<1e-4&&n.getLevelAtTime(e)>1e-5)return n});return n||this.voices.slice().sort(function(t,i){var n=t.getLevelAtTime(e+this.blockTime),o=i.getLevelAtTime(e+this.blockTime);return n<1e-5&&(n=0),o<1e-5&&(o=0),n-o}.bind(this))[0]},t.PolySynth.prototype.triggerAttack=function(t,e,i){return Array.isArray(t)||(t=[t]),e=this.toSeconds(e),t.forEach(function(t){var n=this._getClosestVoice(e,t);n.triggerAttack(t,e,i),this.log("triggerAttack",n.index,t)}.bind(this)),this},t.PolySynth.prototype.triggerRelease=function(t,e){return Array.isArray(t)||(t=[t]),e=this.toSeconds(e),t.forEach(function(t){var i=this._getClosestVoice(e,t);this.log("triggerRelease",i.index,t),i.triggerRelease(e)}.bind(this)),this},t.PolySynth.prototype.triggerAttackRelease=function(e,i,n,o){if(n=this.toSeconds(n),this.triggerAttack(e,n,o),t.isArray(i)&&t.isArray(e))for(var s=0;s<e.length;s++){var r=i[Math.min(s,i.length-1)];this.triggerRelease(e[s],n+this.toSeconds(r))}else this.triggerRelease(e,n+this.toSeconds(i));return this},t.PolySynth.prototype.sync=function(){return this._syncMethod("triggerAttack",1),this._syncMethod("triggerRelease",1),this},t.PolySynth.prototype.set=function(t,e,i){for(var n=0;n<this.voices.length;n++)this.voices[n].set(t,e,i);return this},t.PolySynth.prototype.get=function(t){return this.voices[0].get(t)},t.PolySynth.prototype.releaseAll=function(t){return t=this.toSeconds(t),this.voices.forEach(function(e){e.triggerRelease(t)}),this},t.PolySynth.prototype.dispose=function(){return t.Instrument.prototype.dispose.call(this),this.voices.forEach(function(t){t.dispose()}),this._writable("detune"),this.detune.dispose(),this.detune=null,this.voices=null,this},t.PolySynth.MAX_POLYPHONY=20,t.PolySynth}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(21),i(39),i(53)],void 0===(o=function(t){"use strict";return t.PluckSynth=function(e){e=t.defaultArg(e,t.PluckSynth.defaults),t.Instrument.call(this,e),this._noise=new t.Noise("pink"),this.attackNoise=e.attackNoise,this._lfcf=new t.LowpassCombFilter({resonance:e.resonance,dampening:e.dampening}),this.resonance=this._lfcf.resonance,this.dampening=this._lfcf.dampening,this._noise.connect(this._lfcf),this._lfcf.connect(this.output),this._readOnly(["resonance","dampening"])},t.extend(t.PluckSynth,t.Instrument),t.PluckSynth.defaults={attackNoise:1,dampening:4e3,resonance:.7},t.PluckSynth.prototype.triggerAttack=function(t,e){t=this.toFrequency(t),e=this.toSeconds(e);var i=1/t;return this._lfcf.delayTime.setValueAtTime(i,e),this._noise.start(e),this._noise.stop(e+i*this.attackNoise),this},t.PluckSynth.prototype.dispose=function(){return t.Instrument.prototype.dispose.call(this),this._noise.dispose(),this._lfcf.dispose(),this._noise=null,this._lfcf=null,this._writable(["resonance","dampening"]),this.dampening=null,this.resonance=null,this},t.PluckSynth}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(30),i(41),i(39),i(1),i(9),i(21)],void 0===(o=function(t){"use strict";return t.NoiseSynth=function(e){e=t.defaultArg(e,t.NoiseSynth.defaults),t.Instrument.call(this,e),this.noise=new t.Noise(e.noise),this.envelope=new t.AmplitudeEnvelope(e.envelope),this.noise.chain(this.envelope,this.output),this._readOnly(["noise","envelope"])},t.extend(t.NoiseSynth,t.Instrument),t.NoiseSynth.defaults={noise:{type:"white"},envelope:{attack:.005,decay:.1,sustain:0}},t.NoiseSynth.prototype.triggerAttack=function(t,e){return t=this.toSeconds(t),this.envelope.triggerAttack(t,e),this.noise.start(t),0===this.envelope.sustain&&this.noise.stop(t+this.envelope.attack+this.envelope.decay),this},t.NoiseSynth.prototype.triggerRelease=function(t){return this.envelope.triggerRelease(t),this.noise.stop(t+this.envelope.release),this},t.NoiseSynth.prototype.sync=function(){return this._syncMethod("triggerAttack",0),this._syncMethod("triggerRelease",0),this},t.NoiseSynth.prototype.triggerAttackRelease=function(t,e,i){return e=this.toSeconds(e),t=this.toSeconds(t),this.triggerAttack(e,i),this.triggerRelease(e+t),this},t.NoiseSynth.prototype.dispose=function(){return t.Instrument.prototype.dispose.call(this),this._writable(["noise","envelope"]),this.noise.dispose(),this.noise=null,this.envelope.dispose(),this.envelope=null,this},t.NoiseSynth}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(21),i(48),i(9),i(41),i(30),i(3),i(26),i(5)],void 0===(o=function(t){var e=[1,1.483,1.932,2.546,2.63,3.897];return t.MetalSynth=function(i){i=t.defaultArg(i,t.MetalSynth.defaults),t.Instrument.call(this,i),this.frequency=new t.Signal(i.frequency,t.Type.Frequency),this._oscillators=[],this._freqMultipliers=[],this._amplitue=new t.Gain(0).connect(this.output),this._highpass=new t.Filter({type:"highpass",Q:-3.0102999566398125}).connect(this._amplitue),this._octaves=i.octaves,this._filterFreqScaler=new t.Scale(i.resonance,7e3),this.envelope=new t.Envelope({attack:i.envelope.attack,attackCurve:"linear",decay:i.envelope.decay,sustain:0,release:i.envelope.release}).chain(this._filterFreqScaler,this._highpass.frequency),this.envelope.connect(this._amplitue.gain);for(var n=0;n<e.length;n++){var o=new t.FMOscillator({type:"square",modulationType:"square",harmonicity:i.harmonicity,modulationIndex:i.modulationIndex});o.connect(this._highpass),this._oscillators[n]=o;var s=new t.Multiply(e[n]);this._freqMultipliers[n]=s,this.frequency.chain(s,o.frequency)}this.octaves=i.octaves},t.extend(t.MetalSynth,t.Instrument),t.MetalSynth.defaults={frequency:200,envelope:{attack:.001,decay:1.4,release:.2},harmonicity:5.1,modulationIndex:32,resonance:4e3,octaves:1.5},t.MetalSynth.prototype.triggerAttack=function(e,i){return e=this.toSeconds(e),i=t.defaultArg(i,1),this.envelope.triggerAttack(e,i),this._oscillators.forEach(function(t){t.start(e)}),0===this.envelope.sustain&&this._oscillators.forEach(function(t){t.stop(e+this.envelope.attack+this.envelope.decay)}.bind(this)),this},t.MetalSynth.prototype.triggerRelease=function(t){return t=this.toSeconds(t),this.envelope.triggerRelease(t),this._oscillators.forEach(function(e){e.stop(t+this.envelope.release)}.bind(this)),this},t.MetalSynth.prototype.sync=function(){return this._syncMethod("triggerAttack",0),this._syncMethod("triggerRelease",0),this},t.MetalSynth.prototype.triggerAttackRelease=function(t,e,i){return e=this.toSeconds(e),t=this.toSeconds(t),this.triggerAttack(e,i),this.triggerRelease(e+t),this},Object.defineProperty(t.MetalSynth.prototype,"modulationIndex",{get:function(){return this._oscillators[0].modulationIndex.value},set:function(t){for(var e=0;e<this._oscillators.length;e++)this._oscillators[e].modulationIndex.value=t}}),Object.defineProperty(t.MetalSynth.prototype,"harmonicity",{get:function(){return this._oscillators[0].harmonicity.value},set:function(t){for(var e=0;e<this._oscillators.length;e++)this._oscillators[e].harmonicity.value=t}}),Object.defineProperty(t.MetalSynth.prototype,"resonance",{get:function(){return this._filterFreqScaler.min},set:function(t){this._filterFreqScaler.min=t,this.octaves=this._octaves}}),Object.defineProperty(t.MetalSynth.prototype,"octaves",{get:function(){return this._octaves},set:function(t){this._octaves=t,this._filterFreqScaler.max=this._filterFreqScaler.min*Math.pow(2,t)}}),t.MetalSynth.prototype.dispose=function(){t.Instrument.prototype.dispose.call(this);for(var e=0;e<this._oscillators.length;e++)this._oscillators[e].dispose(),this._freqMultipliers[e].dispose();this._oscillators=null,this._freqMultipliers=null,this.frequency.dispose(),this.frequency=null,this._filterFreqScaler.dispose(),this._filterFreqScaler=null,this._amplitue.dispose(),this._amplitue=null,this.envelope.dispose(),this.envelope=null,this._highpass.dispose(),this._highpass=null},t.MetalSynth}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(37),i(21),i(30)],void 0===(o=function(t){"use strict";return t.MembraneSynth=function(e){e=t.defaultArg(e,t.MembraneSynth.defaults),t.Instrument.call(this,e),this.oscillator=new t.OmniOscillator(e.oscillator),this.envelope=new t.AmplitudeEnvelope(e.envelope),this.octaves=e.octaves,this.pitchDecay=e.pitchDecay,this.oscillator.chain(this.envelope,this.output),this._readOnly(["oscillator","envelope"])},t.extend(t.MembraneSynth,t.Instrument),t.MembraneSynth.defaults={pitchDecay:.05,octaves:10,oscillator:{type:"sine"},envelope:{attack:.001,decay:.4,sustain:.01,release:1.4,attackCurve:"exponential"}},t.MembraneSynth.prototype.triggerAttack=function(t,e,i){e=this.toSeconds(e);var n=(t=this.toFrequency(t))*this.octaves;return this.oscillator.frequency.setValueAtTime(n,e),this.oscillator.frequency.exponentialRampToValueAtTime(t,e+this.toSeconds(this.pitchDecay)),this.envelope.triggerAttack(e,i),this.oscillator.start(e),0===this.envelope.sustain&&this.oscillator.stop(e+this.envelope.attack+this.envelope.decay),this},t.MembraneSynth.prototype.triggerRelease=function(t){return t=this.toSeconds(t),this.envelope.triggerRelease(t),this.oscillator.stop(t+this.envelope.release),this},t.MembraneSynth.prototype.dispose=function(){return t.Instrument.prototype.dispose.call(this),this._writable(["oscillator","envelope"]),this.oscillator.dispose(),this.oscillator=null,this.envelope.dispose(),this.envelope=null,this},t.MembraneSynth}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(38),i(1),i(5),i(25)],void 0===(o=function(t){"use strict";return t.FMSynth=function(e){e=t.defaultArg(e,t.FMSynth.defaults),t.Monophonic.call(this,e),this._carrier=new t.Synth(e.carrier),this._carrier.volume.value=-10,this.oscillator=this._carrier.oscillator,this.envelope=this._carrier.envelope.set(e.envelope),this._modulator=new t.Synth(e.modulator),this._modulator.volume.value=-10,this.modulation=this._modulator.oscillator.set(e.modulation),this.modulationEnvelope=this._modulator.envelope.set(e.modulationEnvelope),this.frequency=new t.Signal(440,t.Type.Frequency),this.detune=new t.Signal(e.detune,t.Type.Cents),this.harmonicity=new t.Multiply(e.harmonicity),this.harmonicity.units=t.Type.Positive,this.modulationIndex=new t.Multiply(e.modulationIndex),this.modulationIndex.units=t.Type.Positive,this._modulationNode=new t.Gain(0),this.frequency.connect(this._carrier.frequency),this.frequency.chain(this.harmonicity,this._modulator.frequency),this.frequency.chain(this.modulationIndex,this._modulationNode),this.detune.fan(this._carrier.detune,this._modulator.detune),this._modulator.connect(this._modulationNode.gain),this._modulationNode.connect(this._carrier.frequency),this._carrier.connect(this.output),this._readOnly(["frequency","harmonicity","modulationIndex","oscillator","envelope","modulation","modulationEnvelope","detune"])},t.extend(t.FMSynth,t.Monophonic),t.FMSynth.defaults={harmonicity:3,modulationIndex:10,detune:0,oscillator:{type:"sine"},envelope:{attack:.01,decay:.01,sustain:1,release:.5},modulation:{type:"square"},modulationEnvelope:{attack:.5,decay:0,sustain:1,release:.5}},t.FMSynth.prototype._triggerEnvelopeAttack=function(t,e){return t=this.toSeconds(t),this._carrier._triggerEnvelopeAttack(t,e),this._modulator._triggerEnvelopeAttack(t),this},t.FMSynth.prototype._triggerEnvelopeRelease=function(t){return t=this.toSeconds(t),this._carrier._triggerEnvelopeRelease(t),this._modulator._triggerEnvelopeRelease(t),this},t.FMSynth.prototype.dispose=function(){return t.Monophonic.prototype.dispose.call(this),this._writable(["frequency","harmonicity","modulationIndex","oscillator","envelope","modulation","modulationEnvelope","detune"]),this._carrier.dispose(),this._carrier=null,this._modulator.dispose(),this._modulator=null,this.frequency.dispose(),this.frequency=null,this.detune.dispose(),this.detune=null,this.modulationIndex.dispose(),this.modulationIndex=null,this.harmonicity.dispose(),this.harmonicity=null,this._modulationNode.dispose(),this._modulationNode=null,this.oscillator=null,this.envelope=null,this.modulationEnvelope=null,this.modulation=null,this},t.FMSynth}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(68),i(12),i(1),i(5),i(25),i(14)],void 0===(o=function(t){"use strict";return t.DuoSynth=function(e){e=t.defaultArg(e,t.DuoSynth.defaults),t.Monophonic.call(this,e),this.voice0=new t.MonoSynth(e.voice0),this.voice0.volume.value=-10,this.voice1=new t.MonoSynth(e.voice1),this.voice1.volume.value=-10,this._vibrato=new t.LFO(e.vibratoRate,-50,50),this._vibrato.start(),this.vibratoRate=this._vibrato.frequency,this._vibratoGain=new t.Gain(e.vibratoAmount,t.Type.Positive),this.vibratoAmount=this._vibratoGain.gain,this.frequency=new t.Signal(440,t.Type.Frequency),this.harmonicity=new t.Multiply(e.harmonicity),this.harmonicity.units=t.Type.Positive,this.frequency.connect(this.voice0.frequency),this.frequency.chain(this.harmonicity,this.voice1.frequency),this._vibrato.connect(this._vibratoGain),this._vibratoGain.fan(this.voice0.detune,this.voice1.detune),this.voice0.connect(this.output),this.voice1.connect(this.output),this._readOnly(["voice0","voice1","frequency","vibratoAmount","vibratoRate"])},t.extend(t.DuoSynth,t.Monophonic),t.DuoSynth.defaults={vibratoAmount:.5,vibratoRate:5,harmonicity:1.5,voice0:{volume:-10,portamento:0,oscillator:{type:"sine"},filterEnvelope:{attack:.01,decay:0,sustain:1,release:.5},envelope:{attack:.01,decay:0,sustain:1,release:.5}},voice1:{volume:-10,portamento:0,oscillator:{type:"sine"},filterEnvelope:{attack:.01,decay:0,sustain:1,release:.5},envelope:{attack:.01,decay:0,sustain:1,release:.5}}},t.DuoSynth.prototype._triggerEnvelopeAttack=function(t,e){return t=this.toSeconds(t),this.voice0._triggerEnvelopeAttack(t,e),this.voice1._triggerEnvelopeAttack(t,e),this},t.DuoSynth.prototype._triggerEnvelopeRelease=function(t){return this.voice0._triggerEnvelopeRelease(t),this.voice1._triggerEnvelopeRelease(t),this},t.DuoSynth.prototype.getLevelAtTime=function(t){return(this.voice0.getLevelAtTime(t)+this.voice1.getLevelAtTime(t))/2},t.DuoSynth.prototype.dispose=function(){return t.Monophonic.prototype.dispose.call(this),this._writable(["voice0","voice1","frequency","vibratoAmount","vibratoRate"]),this.voice0.dispose(),this.voice0=null,this.voice1.dispose(),this.voice1=null,this.frequency.dispose(),this.frequency=null,this._vibratoGain.dispose(),this._vibratoGain=null,this._vibrato=null,this.harmonicity.dispose(),this.harmonicity=null,this.vibratoAmount.dispose(),this.vibratoAmount=null,this.vibratoRate=null,this},t.DuoSynth}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(38),i(1),i(5),i(25),i(22),i(3)],void 0===(o=function(t){"use strict";return t.AMSynth=function(e){e=t.defaultArg(e,t.AMSynth.defaults),t.Monophonic.call(this,e),this._carrier=new t.Synth,this._carrier.volume.value=-10,this.oscillator=this._carrier.oscillator.set(e.oscillator),this.envelope=this._carrier.envelope.set(e.envelope),this._modulator=new t.Synth,this._modulator.volume.value=-10,this.modulation=this._modulator.oscillator.set(e.modulation),this.modulationEnvelope=this._modulator.envelope.set(e.modulationEnvelope),this.frequency=new t.Signal(440,t.Type.Frequency),this.detune=new t.Signal(e.detune,t.Type.Cents),this.harmonicity=new t.Multiply(e.harmonicity),this.harmonicity.units=t.Type.Positive,this._modulationScale=new t.AudioToGain,this._modulationNode=new t.Gain,this.frequency.connect(this._carrier.frequency),this.frequency.chain(this.harmonicity,this._modulator.frequency),this.detune.fan(this._carrier.detune,this._modulator.detune),this._modulator.chain(this._modulationScale,this._modulationNode.gain),this._carrier.chain(this._modulationNode,this.output),this._readOnly(["frequency","harmonicity","oscillator","envelope","modulation","modulationEnvelope","detune"])},t.extend(t.AMSynth,t.Monophonic),t.AMSynth.defaults={harmonicity:3,detune:0,oscillator:{type:"sine"},envelope:{attack:.01,decay:.01,sustain:1,release:.5},modulation:{type:"square"},modulationEnvelope:{attack:.5,decay:0,sustain:1,release:.5}},t.AMSynth.prototype._triggerEnvelopeAttack=function(t,e){return t=this.toSeconds(t),this._carrier._triggerEnvelopeAttack(t,e),this._modulator._triggerEnvelopeAttack(t),this},t.AMSynth.prototype._triggerEnvelopeRelease=function(t){return this._carrier._triggerEnvelopeRelease(t),this._modulator._triggerEnvelopeRelease(t),this},t.AMSynth.prototype.dispose=function(){return t.Monophonic.prototype.dispose.call(this),this._writable(["frequency","harmonicity","oscillator","envelope","modulation","modulationEnvelope","detune"]),this._carrier.dispose(),this._carrier=null,this._modulator.dispose(),this._modulator=null,this.frequency.dispose(),this.frequency=null,this.detune.dispose(),this.detune=null,this.harmonicity.dispose(),this.harmonicity=null,this._modulationScale.dispose(),this._modulationScale=null,this._modulationNode.dispose(),this._modulationNode=null,this.oscillator=null,this.envelope=null,this.modulationEnvelope=null,this.modulation=null,this},t.AMSynth}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(72),i(16)],void 0===(o=function(t){"use strict";return t.Sequence=function(){var e=t.defaults(arguments,["callback","events","subdivision"],t.Sequence),i=e.events;if(delete e.events,t.Part.call(this,e),this._subdivision=this.toTicks(e.subdivision),t.isUndef(e.loopEnd)&&t.isDefined(i)&&(this._loopEnd=i.length*this._subdivision),this._loop=!0,t.isDefined(i))for(var n=0;n<i.length;n++)this.add(n,i[n])},t.extend(t.Sequence,t.Part),t.Sequence.defaults={subdivision:"4n"},Object.defineProperty(t.Sequence.prototype,"subdivision",{get:function(){return t.Ticks(this._subdivision).toSeconds()}}),t.Sequence.prototype.at=function(e,i){return t.isArray(i)&&this.remove(e),t.Part.prototype.at.call(this,this._indexTime(e),i)},t.Sequence.prototype.add=function(e,i){if(null===i)return this;if(t.isArray(i)){var n=Math.round(this._subdivision/i.length);i=new t.Sequence(this._tick.bind(this),i,t.Ticks(n))}return t.Part.prototype.add.call(this,this._indexTime(e),i),this},t.Sequence.prototype.remove=function(e,i){return t.Part.prototype.remove.call(this,this._indexTime(e),i),this},t.Sequence.prototype._indexTime=function(e){return e instanceof t.TransportTime?e:t.Ticks(e*this._subdivision+this.startOffset).toSeconds()},t.Sequence.prototype.dispose=function(){return t.Part.prototype.dispose.call(this),this},t.Sequence}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(73),i(80)],void 0===(o=function(t){return t.Pattern=function(){var e=t.defaults(arguments,["callback","values","pattern"],t.Pattern);t.Loop.call(this,e),this._pattern=new t.CtrlPattern({values:e.values,type:e.pattern,index:e.index})},t.extend(t.Pattern,t.Loop),t.Pattern.defaults={pattern:t.CtrlPattern.Type.Up,callback:t.noOp,values:[]},t.Pattern.prototype._tick=function(t){this.callback(t,this._pattern.value),this._pattern.next()},Object.defineProperty(t.Pattern.prototype,"index",{get:function(){return this._pattern.index},set:function(t){this._pattern.index=t}}),Object.defineProperty(t.Pattern.prototype,"values",{get:function(){return this._pattern.values},set:function(t){this._pattern.values=t}}),Object.defineProperty(t.Pattern.prototype,"value",{get:function(){return this._pattern.value}}),Object.defineProperty(t.Pattern.prototype,"pattern",{get:function(){return this._pattern.type},set:function(t){this._pattern.type=t}}),t.Pattern.prototype.dispose=function(){t.Loop.prototype.dispose.call(this),this._pattern.dispose(),this._pattern=null},t.Pattern}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(8),i(18),i(12)],void 0===(o=function(t){"use strict";return t.Vibrato=function(){var e=t.defaults(arguments,["frequency","depth"],t.Vibrato);t.Effect.call(this,e),this._delayNode=new t.Delay(0,e.maxDelay),this._lfo=new t.LFO({type:e.type,min:0,max:e.maxDelay,frequency:e.frequency,phase:-90}).start().connect(this._delayNode.delayTime),this.frequency=this._lfo.frequency,this.depth=this._lfo.amplitude,this.depth.value=e.depth,this._readOnly(["frequency","depth"]),this.effectSend.chain(this._delayNode,this.effectReturn)},t.extend(t.Vibrato,t.Effect),t.Vibrato.defaults={maxDelay:.005,frequency:5,depth:.1,type:"sine"},Object.defineProperty(t.Vibrato.prototype,"type",{get:function(){return this._lfo.type},set:function(t){this._lfo.type=t}}),t.Vibrato.prototype.dispose=function(){t.Effect.prototype.dispose.call(this),this._delayNode.dispose(),this._delayNode=null,this._lfo.dispose(),this._lfo=null,this._writable(["frequency","depth"]),this.frequency=null,this.depth=null},t.Vibrato}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(12),i(15)],void 0===(o=function(t){"use strict";return t.Tremolo=function(){var e=t.defaults(arguments,["frequency","depth"],t.Tremolo);t.StereoEffect.call(this,e),this._lfoL=new t.LFO({phase:e.spread,min:1,max:0}),this._lfoR=new t.LFO({phase:e.spread,min:1,max:0}),this._amplitudeL=new t.Gain,this._amplitudeR=new t.Gain,this.frequency=new t.Signal(e.frequency,t.Type.Frequency),this.depth=new t.Signal(e.depth,t.Type.NormalRange),this._readOnly(["frequency","depth"]),this.effectSendL.chain(this._amplitudeL,this.effectReturnL),this.effectSendR.chain(this._amplitudeR,this.effectReturnR),this._lfoL.connect(this._amplitudeL.gain),this._lfoR.connect(this._amplitudeR.gain),this.frequency.fan(this._lfoL.frequency,this._lfoR.frequency),this.depth.fan(this._lfoR.amplitude,this._lfoL.amplitude),this.type=e.type,this.spread=e.spread},t.extend(t.Tremolo,t.StereoEffect),t.Tremolo.defaults={frequency:10,type:"sine",depth:.5,spread:180},t.Tremolo.prototype.start=function(t){return this._lfoL.start(t),this._lfoR.start(t),this},t.Tremolo.prototype.stop=function(t){return this._lfoL.stop(t),this._lfoR.stop(t),this},t.Tremolo.prototype.sync=function(e){return this._lfoL.sync(e),this._lfoR.sync(e),t.Transport.syncSignal(this.frequency),this},t.Tremolo.prototype.unsync=function(){return this._lfoL.unsync(),this._lfoR.unsync(),t.Transport.unsyncSignal(this.frequency),this},Object.defineProperty(t.Tremolo.prototype,"type",{get:function(){return this._lfoL.type},set:function(t){this._lfoL.type=t,this._lfoR.type=t}}),Object.defineProperty(t.Tremolo.prototype,"spread",{get:function(){return this._lfoR.phase-this._lfoL.phase},set:function(t){this._lfoL.phase=90-t/2,this._lfoR.phase=t/2+90}}),t.Tremolo.prototype.dispose=function(){return t.StereoEffect.prototype.dispose.call(this),this._writable(["frequency","depth"]),this._lfoL.dispose(),this._lfoL=null,this._lfoR.dispose(),this._lfoR=null,this._amplitudeL.dispose(),this._amplitudeL=null,this._amplitudeR.dispose(),this._amplitudeR=null,this.frequency=null,this.depth=null,this},t.Tremolo}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(75),i(1),i(5),i(13)],void 0===(o=function(t){"use strict";return t.StereoWidener=function(){var e=t.defaults(arguments,["width"],t.StereoWidener);t.MidSideEffect.call(this,e),this.width=new t.Signal(e.width,t.Type.NormalRange),this._readOnly(["width"]),this._twoTimesWidthMid=new t.Multiply(2),this._twoTimesWidthSide=new t.Multiply(2),this._midMult=new t.Multiply,this._twoTimesWidthMid.connect(this._midMult,0,1),this.midSend.chain(this._midMult,this.midReturn),this._oneMinusWidth=new t.Subtract,this._oneMinusWidth.connect(this._twoTimesWidthMid),this.context.getConstant(1).connect(this._oneMinusWidth,0,0),this.width.connect(this._oneMinusWidth,0,1),this._sideMult=new t.Multiply,this.width.connect(this._twoTimesWidthSide),this._twoTimesWidthSide.connect(this._sideMult,0,1),this.sideSend.chain(this._sideMult,this.sideReturn)},t.extend(t.StereoWidener,t.MidSideEffect),t.StereoWidener.defaults={width:.5},t.StereoWidener.prototype.dispose=function(){return t.MidSideEffect.prototype.dispose.call(this),this._writable(["width"]),this.width.dispose(),this.width=null,this._midMult.dispose(),this._midMult=null,this._sideMult.dispose(),this._sideMult=null,this._twoTimesWidthMid.dispose(),this._twoTimesWidthMid=null,this._twoTimesWidthSide.dispose(),this._twoTimesWidthSide=null,this._oneMinusWidth.dispose(),this._oneMinusWidth=null,this},t.StereoWidener}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(15),i(32),i(3)],void 0===(o=function(t){"use strict";return t.StereoFeedbackEffect=function(){var e=t.defaults(arguments,["feedback"],t.FeedbackEffect);t.StereoEffect.call(this,e),this.feedback=new t.Signal(e.feedback,t.Type.NormalRange),this._feedbackL=new t.Gain,this._feedbackR=new t.Gain,this.effectReturnL.chain(this._feedbackL,this.effectSendL),this.effectReturnR.chain(this._feedbackR,this.effectSendR),this.feedback.fan(this._feedbackL.gain,this._feedbackR.gain),this._readOnly(["feedback"])},t.extend(t.StereoFeedbackEffect,t.StereoEffect),t.StereoFeedbackEffect.prototype.dispose=function(){return t.StereoEffect.prototype.dispose.call(this),this._writable(["feedback"]),this.feedback.dispose(),this.feedback=null,this._feedbackL.dispose(),this._feedbackL=null,this._feedbackR.dispose(),this._feedbackR=null,this},t.StereoFeedbackEffect}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(78),i(9),i(10),i(39),i(3),i(76)],void 0===(o=function(t){"use strict";return t.Reverb=function(){var e=t.defaults(arguments,["decay"],t.Reverb);t.Effect.call(this,e),this._convolver=this.context.createConvolver(),this.decay=e.decay,this.preDelay=e.preDelay,this.connectEffect(this._convolver)},t.extend(t.Reverb,t.Effect),t.Reverb.defaults={decay:1.5,preDelay:.01},t.Reverb.prototype.generate=function(){return t.Offline(function(){var e=new t.Noise,i=new t.Noise,n=new t.Merge;e.connect(n.left),i.connect(n.right);var o=(new t.Gain).toMaster();n.connect(o),e.start(0),i.start(0),o.gain.setValueAtTime(0,0),o.gain.linearRampToValueAtTime(1,this.preDelay),o.gain.exponentialApproachValueAtTime(0,this.preDelay,this.decay-this.preDelay)}.bind(this),this.decay).then(function(t){return this._convolver.buffer=t.get(),this}.bind(this))},t.Reverb.prototype.dispose=function(){return t.Effect.prototype.dispose.call(this),this._convolver.disconnect(),this._convolver=null,this},t.Reverb}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(12),i(23),i(1),i(32),i(18)],void 0===(o=function(t){"use strict";return t.PitchShift=function(){var e=t.defaults(arguments,["pitch"],t.PitchShift);t.FeedbackEffect.call(this,e),this._frequency=new t.Signal(0),this._delayA=new t.Delay(0,1),this._lfoA=new t.LFO({min:0,max:.1,type:"sawtooth"}).connect(this._delayA.delayTime),this._delayB=new t.Delay(0,1),this._lfoB=new t.LFO({min:0,max:.1,type:"sawtooth",phase:180}).connect(this._delayB.delayTime),this._crossFade=new t.CrossFade,this._crossFadeLFO=new t.LFO({min:0,max:1,type:"triangle",phase:90}).connect(this._crossFade.fade),this._feedbackDelay=new t.Delay(e.delayTime),this.delayTime=this._feedbackDelay.delayTime,this._readOnly("delayTime"),this._pitch=e.pitch,this._windowSize=e.windowSize,this._delayA.connect(this._crossFade.a),this._delayB.connect(this._crossFade.b),this._frequency.fan(this._lfoA.frequency,this._lfoB.frequency,this._crossFadeLFO.frequency),this.effectSend.fan(this._delayA,this._delayB),this._crossFade.chain(this._feedbackDelay,this.effectReturn);var i=this.now();this._lfoA.start(i),this._lfoB.start(i),this._crossFadeLFO.start(i),this.windowSize=this._windowSize},t.extend(t.PitchShift,t.FeedbackEffect),t.PitchShift.defaults={pitch:0,windowSize:.1,delayTime:0,feedback:0},Object.defineProperty(t.PitchShift.prototype,"pitch",{get:function(){return this._pitch},set:function(e){this._pitch=e;var i=0;e<0?(this._lfoA.min=0,this._lfoA.max=this._windowSize,this._lfoB.min=0,this._lfoB.max=this._windowSize,i=t.intervalToFrequencyRatio(e-1)+1):(this._lfoA.min=this._windowSize,this._lfoA.max=0,this._lfoB.min=this._windowSize,this._lfoB.max=0,i=t.intervalToFrequencyRatio(e)-1),this._frequency.value=i*(1.2/this._windowSize)}}),Object.defineProperty(t.PitchShift.prototype,"windowSize",{get:function(){return this._windowSize},set:function(t){this._windowSize=this.toSeconds(t),this.pitch=this._pitch}}),t.PitchShift.prototype.dispose=function(){return t.FeedbackEffect.prototype.dispose.call(this),this._frequency.dispose(),this._frequency=null,this._delayA.disconnect(),this._delayA=null,this._delayB.disconnect(),this._delayB=null,this._lfoA.dispose(),this._lfoA=null,this._lfoB.dispose(),this._lfoB=null,this._crossFade.dispose(),this._crossFade=null,this._crossFadeLFO.dispose(),this._crossFadeLFO=null,this._writable("delayTime"),this._feedbackDelay.dispose(),this._feedbackDelay=null,this.delayTime=null,this},t.PitchShift}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(74),i(1),i(18)],void 0===(o=function(t){"use strict";return t.PingPongDelay=function(){var e=t.defaults(arguments,["delayTime","feedback"],t.PingPongDelay);t.StereoXFeedbackEffect.call(this,e),this._leftDelay=new t.Delay(0,e.maxDelayTime),this._rightDelay=new t.Delay(0,e.maxDelayTime),this._rightPreDelay=new t.Delay(0,e.maxDelayTime),this.delayTime=new t.Signal(e.delayTime,t.Type.Time),this.effectSendL.chain(this._leftDelay,this.effectReturnL),this.effectSendR.chain(this._rightPreDelay,this._rightDelay,this.effectReturnR),this.delayTime.fan(this._leftDelay.delayTime,this._rightDelay.delayTime,this._rightPreDelay.delayTime),this._feedbackLR.disconnect(),this._feedbackLR.connect(this._rightDelay),this._readOnly(["delayTime"])},t.extend(t.PingPongDelay,t.StereoXFeedbackEffect),t.PingPongDelay.defaults={delayTime:.25,maxDelayTime:1},t.PingPongDelay.prototype.dispose=function(){return t.StereoXFeedbackEffect.prototype.dispose.call(this),this._leftDelay.dispose(),this._leftDelay=null,this._rightDelay.dispose(),this._rightDelay=null,this._rightPreDelay.dispose(),this._rightPreDelay=null,this._writable(["delayTime"]),this.delayTime.dispose(),this.delayTime=null,this},t.PingPongDelay}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(12),i(9),i(15)],void 0===(o=function(t){"use strict";return t.Phaser=function(){var e=t.defaults(arguments,["frequency","octaves","baseFrequency"],t.Phaser);t.StereoEffect.call(this,e),this._lfoL=new t.LFO(e.frequency,0,1),this._lfoR=new t.LFO(e.frequency,0,1),this._lfoR.phase=180,this._baseFrequency=e.baseFrequency,this._octaves=e.octaves,this.Q=new t.Signal(e.Q,t.Type.Positive),this._filtersL=this._makeFilters(e.stages,this._lfoL,this.Q),this._filtersR=this._makeFilters(e.stages,this._lfoR,this.Q),this.frequency=this._lfoL.frequency,this.frequency.value=e.frequency,this.effectSendL.connect(this._filtersL[0]),this.effectSendR.connect(this._filtersR[0]),this._filtersL[e.stages-1].connect(this.effectReturnL),this._filtersR[e.stages-1].connect(this.effectReturnR),this._lfoL.frequency.connect(this._lfoR.frequency),this.baseFrequency=e.baseFrequency,this.octaves=e.octaves,this._lfoL.start(),this._lfoR.start(),this._readOnly(["frequency","Q"])},t.extend(t.Phaser,t.StereoEffect),t.Phaser.defaults={frequency:.5,octaves:3,stages:10,Q:10,baseFrequency:350},t.Phaser.prototype._makeFilters=function(e,i,n){for(var o=new Array(e),s=0;s<e;s++){var r=this.context.createBiquadFilter();r.type="allpass",n.connect(r.Q),i.connect(r.frequency),o[s]=r}return t.connectSeries.apply(t,o),o},Object.defineProperty(t.Phaser.prototype,"octaves",{get:function(){return this._octaves},set:function(t){this._octaves=t;var e=this._baseFrequency*Math.pow(2,t);this._lfoL.max=e,this._lfoR.max=e}}),Object.defineProperty(t.Phaser.prototype,"baseFrequency",{get:function(){return this._baseFrequency},set:function(t){this._baseFrequency=t,this._lfoL.min=t,this._lfoR.min=t,this.octaves=this._octaves}}),t.Phaser.prototype.dispose=function(){t.StereoEffect.prototype.dispose.call(this),this._writable(["frequency","Q"]),this.Q.dispose(),this.Q=null,this._lfoL.dispose(),this._lfoL=null,this._lfoR.dispose(),this._lfoR=null;for(var e=0;e<this._filtersL.length;e++)this._filtersL[e].disconnect(),this._filtersL[e]=null;this._filtersL=null;for(var i=0;i<this._filtersR.length;i++)this._filtersR[i].disconnect(),this._filtersR[i]=null;return this._filtersR=null,this.frequency=null,this},t.Phaser}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(58),i(15),i(26)],void 0===(o=function(t){"use strict";var e=[.06748,.06404,.08212,.09004],i=[.773,.802,.753,.733],n=[347,113,37];return t.JCReverb=function(){var o=t.defaults(arguments,["roomSize"],t.JCReverb);t.StereoEffect.call(this,o),this.roomSize=new t.Signal(o.roomSize,t.Type.NormalRange),this._scaleRoomSize=new t.Scale(-.733,.197),this._allpassFilters=[],this._feedbackCombFilters=[];for(var s=0;s<n.length;s++){var r=this.context.createBiquadFilter();r.type="allpass",r.frequency.value=n[s],this._allpassFilters.push(r)}for(var a=0;a<e.length;a++){var l=new t.FeedbackCombFilter(e[a],.1);this._scaleRoomSize.connect(l.resonance),l.resonance.value=i[a],this._allpassFilters[this._allpassFilters.length-1].connect(l),a<e.length/2?l.connect(this.effectReturnL):l.connect(this.effectReturnR),this._feedbackCombFilters.push(l)}this.roomSize.connect(this._scaleRoomSize),t.connectSeries.apply(t,this._allpassFilters),this.effectSendL.connect(this._allpassFilters[0]),this.effectSendR.connect(this._allpassFilters[0]),this._readOnly(["roomSize"])},t.extend(t.JCReverb,t.StereoEffect),t.JCReverb.defaults={roomSize:.5},t.JCReverb.prototype.dispose=function(){t.StereoEffect.prototype.dispose.call(this);for(var e=0;e<this._allpassFilters.length;e++)this._allpassFilters[e].disconnect(),this._allpassFilters[e]=null;this._allpassFilters=null;for(var i=0;i<this._feedbackCombFilters.length;i++)this._feedbackCombFilters[i].dispose(),this._feedbackCombFilters[i]=null;return this._feedbackCombFilters=null,this._writable(["roomSize"]),this.roomSize.dispose(),this.roomSize=null,this._scaleRoomSize.dispose(),this._scaleRoomSize=null,this},t.JCReverb}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(53),i(15),i(1),i(19),i(10),i(42)],void 0===(o=function(t){"use strict";var e=[1557/44100,1617/44100,1491/44100,1422/44100,1277/44100,1356/44100,1188/44100,1116/44100],i=[225,556,441,341];return t.Freeverb=function(){var n=t.defaults(arguments,["roomSize","dampening"],t.Freeverb);t.StereoEffect.call(this,n),this.roomSize=new t.Signal(n.roomSize,t.Type.NormalRange),this.dampening=new t.Signal(n.dampening,t.Type.Frequency),this._combFilters=[],this._allpassFiltersL=[],this._allpassFiltersR=[];for(var o=0;o<i.length;o++){var s=this.context.createBiquadFilter();s.type="allpass",s.frequency.value=i[o],this._allpassFiltersL.push(s)}for(var r=0;r<i.length;r++){var a=this.context.createBiquadFilter();a.type="allpass",a.frequency.value=i[r],this._allpassFiltersR.push(a)}for(var l=0;l<e.length;l++){var h=new t.LowpassCombFilter(e[l]);l<e.length/2?this.effectSendL.chain(h,this._allpassFiltersL[0]):this.effectSendR.chain(h,this._allpassFiltersR[0]),this.roomSize.connect(h.resonance),this.dampening.connect(h.dampening),this._combFilters.push(h)}t.connectSeries.apply(t,this._allpassFiltersL),t.connectSeries.apply(t,this._allpassFiltersR),this._allpassFiltersL[this._allpassFiltersL.length-1].connect(this.effectReturnL),this._allpassFiltersR[this._allpassFiltersR.length-1].connect(this.effectReturnR),this._readOnly(["roomSize","dampening"])},t.extend(t.Freeverb,t.StereoEffect),t.Freeverb.defaults={roomSize:.7,dampening:3e3},t.Freeverb.prototype.dispose=function(){t.StereoEffect.prototype.dispose.call(this);for(var e=0;e<this._allpassFiltersL.length;e++)this._allpassFiltersL[e].disconnect(),this._allpassFiltersL[e]=null;this._allpassFiltersL=null;for(var i=0;i<this._allpassFiltersR.length;i++)this._allpassFiltersR[i].disconnect(),this._allpassFiltersR[i]=null;this._allpassFiltersR=null;for(var n=0;n<this._combFilters.length;n++)this._combFilters[n].dispose(),this._combFilters[n]=null;return this._combFilters=null,this._writable(["roomSize","dampening"]),this.roomSize.dispose(),this.roomSize=null,this.dampening.dispose(),this.dampening=null,this},t.Freeverb}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(32),i(1),i(18)],void 0===(o=function(t){"use strict";return t.FeedbackDelay=function(){var e=t.defaults(arguments,["delayTime","feedback"],t.FeedbackDelay);t.FeedbackEffect.call(this,e),this._delayNode=new t.Delay(e.delayTime,e.maxDelay),this.delayTime=this._delayNode.delayTime,this.connectEffect(this._delayNode),this._readOnly(["delayTime"])},t.extend(t.FeedbackDelay,t.FeedbackEffect),t.FeedbackDelay.defaults={delayTime:.25,maxDelay:1},t.FeedbackDelay.prototype.dispose=function(){return t.FeedbackEffect.prototype.dispose.call(this),this._delayNode.dispose(),this._delayNode=null,this._writable(["delayTime"]),this.delayTime=null,this},t.FeedbackDelay}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(8),i(7)],void 0===(o=function(t){"use strict";return t.Distortion=function(){var e=t.defaults(arguments,["distortion"],t.Distortion);t.Effect.call(this,e),this._shaper=new t.WaveShaper(4096),this._distortion=e.distortion,this.connectEffect(this._shaper),this.distortion=e.distortion,this.oversample=e.oversample},t.extend(t.Distortion,t.Effect),t.Distortion.defaults={distortion:.4,oversample:"none"},Object.defineProperty(t.Distortion.prototype,"distortion",{get:function(){return this._distortion},set:function(t){this._distortion=t;var e=100*t,i=Math.PI/180;this._shaper.setMap(function(t){return Math.abs(t)<.001?0:(3+e)*t*20*i/(Math.PI+e*Math.abs(t))})}}),Object.defineProperty(t.Distortion.prototype,"oversample",{get:function(){return this._shaper.oversample},set:function(t){this._shaper.oversample=t}}),t.Distortion.prototype.dispose=function(){return t.Effect.prototype.dispose.call(this),this._shaper.dispose(),this._shaper=null,this},t.Distortion}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(12),i(15),i(18)],void 0===(o=function(t){"use strict";return t.Chorus=function(){var e=t.defaults(arguments,["frequency","delayTime","depth"],t.Chorus);t.StereoEffect.call(this,e),this._depth=e.depth,this._delayTime=e.delayTime/1e3,this._lfoL=new t.LFO({frequency:e.frequency,min:0,max:1}),this._lfoR=new t.LFO({frequency:e.frequency,min:0,max:1,phase:180}),this._delayNodeL=new t.Delay,this._delayNodeR=new t.Delay,this.frequency=this._lfoL.frequency,this.effectSendL.chain(this._delayNodeL,this.effectReturnL),this.effectSendR.chain(this._delayNodeR,this.effectReturnR),this.effectSendL.connect(this.effectReturnL),this.effectSendR.connect(this.effectReturnR),this._lfoL.connect(this._delayNodeL.delayTime),this._lfoR.connect(this._delayNodeR.delayTime),this._lfoL.start(),this._lfoR.start(),this._lfoL.frequency.connect(this._lfoR.frequency),this.depth=this._depth,this.frequency.value=e.frequency,this.type=e.type,this._readOnly(["frequency"]),this.spread=e.spread},t.extend(t.Chorus,t.StereoEffect),t.Chorus.defaults={frequency:1.5,delayTime:3.5,depth:.7,type:"sine",spread:180},Object.defineProperty(t.Chorus.prototype,"depth",{get:function(){return this._depth},set:function(t){this._depth=t;var e=this._delayTime*t;this._lfoL.min=Math.max(this._delayTime-e,0),this._lfoL.max=this._delayTime+e,this._lfoR.min=Math.max(this._delayTime-e,0),this._lfoR.max=this._delayTime+e}}),Object.defineProperty(t.Chorus.prototype,"delayTime",{get:function(){return 1e3*this._delayTime},set:function(t){this._delayTime=t/1e3,this.depth=this._depth}}),Object.defineProperty(t.Chorus.prototype,"type",{get:function(){return this._lfoL.type},set:function(t){this._lfoL.type=t,this._lfoR.type=t}}),Object.defineProperty(t.Chorus.prototype,"spread",{get:function(){return this._lfoR.phase-this._lfoL.phase},set:function(t){this._lfoL.phase=90-t/2,this._lfoR.phase=t/2+90}}),t.Chorus.prototype.dispose=function(){return t.StereoEffect.prototype.dispose.call(this),this._lfoL.dispose(),this._lfoL=null,this._lfoR.dispose(),this._lfoR=null,this._delayNodeL.dispose(),this._delayNodeL=null,this._delayNodeR.dispose(),this._delayNodeR=null,this._writable("frequency"),this.frequency=null,this},t.Chorus}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(8),i(7)],void 0===(o=function(t){"use strict";return t.Chebyshev=function(){var e=t.defaults(arguments,["order"],t.Chebyshev);t.Effect.call(this,e),this._shaper=new t.WaveShaper(4096),this._order=e.order,this.connectEffect(this._shaper),this.order=e.order,this.oversample=e.oversample},t.extend(t.Chebyshev,t.Effect),t.Chebyshev.defaults={order:1,oversample:"none"},t.Chebyshev.prototype._getCoefficient=function(t,e,i){return i.hasOwnProperty(e)?i[e]:(i[e]=0===e?0:1===e?t:2*t*this._getCoefficient(t,e-1,i)-this._getCoefficient(t,e-2,i),i[e])},Object.defineProperty(t.Chebyshev.prototype,"order",{get:function(){return this._order},set:function(t){this._order=t;for(var e=new Array(4096),i=e.length,n=0;n<i;++n){var o=2*n/i-1;e[n]=0===o?0:this._getCoefficient(o,t,{})}this._shaper.curve=e}}),Object.defineProperty(t.Chebyshev.prototype,"oversample",{get:function(){return this._shaper.oversample},set:function(t){this._shaper.oversample=t}}),t.Chebyshev.prototype.dispose=function(){return t.Effect.prototype.dispose.call(this),this._shaper.dispose(),this._shaper=null,this},t.Chebyshev}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(8),i(13),i(77)],void 0===(o=function(t){"use strict";return t.BitCrusher=function(){var e=t.defaults(arguments,["bits"],t.BitCrusher);t.Effect.call(this,e);var i=1/Math.pow(2,e.bits-1);this._subtract=new t.Subtract,this._modulo=new t.Modulo(i),this._bits=e.bits,this.effectSend.fan(this._subtract,this._modulo),this._modulo.connect(this._subtract,0,1),this._subtract.connect(this.effectReturn)},t.extend(t.BitCrusher,t.Effect),t.BitCrusher.defaults={bits:4},Object.defineProperty(t.BitCrusher.prototype,"bits",{get:function(){return this._bits},set:function(t){this._bits=t;var e=1/Math.pow(2,t-1);this._modulo.value=e}}),t.BitCrusher.prototype.dispose=function(){return t.Effect.prototype.dispose.call(this),this._subtract.dispose(),this._subtract=null,this._modulo.dispose(),this._modulo=null,this},t.BitCrusher}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(57),i(42),i(8),i(9)],void 0===(o=function(t){"use strict";return t.AutoWah=function(){var e=t.defaults(arguments,["baseFrequency","octaves","sensitivity"],t.AutoWah);t.Effect.call(this,e),this.follower=new t.Follower(e.follower),this._sweepRange=new t.ScaleExp(0,1,.5),this._baseFrequency=e.baseFrequency,this._octaves=e.octaves,this._inputBoost=new t.Gain,this._bandpass=new t.Filter({rolloff:-48,frequency:0,Q:e.Q}),this._peaking=new t.Filter(0,"peaking"),this._peaking.gain.value=e.gain,this.gain=this._peaking.gain,this.Q=this._bandpass.Q,this.effectSend.chain(this._inputBoost,this.follower,this._sweepRange),this._sweepRange.connect(this._bandpass.frequency),this._sweepRange.connect(this._peaking.frequency),this.effectSend.chain(this._bandpass,this._peaking,this.effectReturn),this._setSweepRange(),this.sensitivity=e.sensitivity,this._readOnly(["gain","Q"])},t.extend(t.AutoWah,t.Effect),t.AutoWah.defaults={baseFrequency:100,octaves:6,sensitivity:0,Q:2,gain:2,follower:{attack:.3,release:.5}},Object.defineProperty(t.AutoWah.prototype,"octaves",{get:function(){return this._octaves},set:function(t){this._octaves=t,this._setSweepRange()}}),Object.defineProperty(t.AutoWah.prototype,"baseFrequency",{get:function(){return this._baseFrequency},set:function(t){this._baseFrequency=t,this._setSweepRange()}}),Object.defineProperty(t.AutoWah.prototype,"sensitivity",{get:function(){return t.gainToDb(1/this._inputBoost.gain.value)},set:function(e){this._inputBoost.gain.value=1/t.dbToGain(e)}}),t.AutoWah.prototype._setSweepRange=function(){this._sweepRange.min=this._baseFrequency,this._sweepRange.max=Math.min(this._baseFrequency*Math.pow(2,this._octaves),this.context.sampleRate/2)},t.AutoWah.prototype.dispose=function(){return t.Effect.prototype.dispose.call(this),this.follower.dispose(),this.follower=null,this._sweepRange.dispose(),this._sweepRange=null,this._bandpass.dispose(),this._bandpass=null,this._peaking.dispose(),this._peaking=null,this._inputBoost.dispose(),this._inputBoost=null,this._writable(["gain","Q"]),this.gain=null,this.Q=null,this},t.AutoWah}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(8),i(12),i(60)],void 0===(o=function(t){"use strict";return t.AutoPanner=function(){var e=t.defaults(arguments,["frequency"],t.AutoPanner);t.Effect.call(this,e),this._lfo=new t.LFO({frequency:e.frequency,amplitude:e.depth,min:-1,max:1}),this.depth=this._lfo.amplitude,this._panner=new t.Panner,this.frequency=this._lfo.frequency,this.connectEffect(this._panner),this._lfo.connect(this._panner.pan),this.type=e.type,this._readOnly(["depth","frequency"])},t.extend(t.AutoPanner,t.Effect),t.AutoPanner.defaults={frequency:1,type:"sine",depth:1},t.AutoPanner.prototype.start=function(t){return this._lfo.start(t),this},t.AutoPanner.prototype.stop=function(t){return this._lfo.stop(t),this},t.AutoPanner.prototype.sync=function(t){return this._lfo.sync(t),this},t.AutoPanner.prototype.unsync=function(){return this._lfo.unsync(),this},Object.defineProperty(t.AutoPanner.prototype,"type",{get:function(){return this._lfo.type},set:function(t){this._lfo.type=t}}),t.AutoPanner.prototype.dispose=function(){return t.Effect.prototype.dispose.call(this),this._lfo.dispose(),this._lfo=null,this._panner.dispose(),this._panner=null,this._writable(["depth","frequency"]),this.frequency=null,this.depth=null,this},t.AutoPanner}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(8),i(12),i(9)],void 0===(o=function(t){"use strict";return t.AutoFilter=function(){var e=t.defaults(arguments,["frequency","baseFrequency","octaves"],t.AutoFilter);t.Effect.call(this,e),this._lfo=new t.LFO({frequency:e.frequency,amplitude:e.depth}),this.depth=this._lfo.amplitude,this.frequency=this._lfo.frequency,this.filter=new t.Filter(e.filter),this._octaves=0,this.connectEffect(this.filter),this._lfo.connect(this.filter.frequency),this.type=e.type,this._readOnly(["frequency","depth"]),this.octaves=e.octaves,this.baseFrequency=e.baseFrequency},t.extend(t.AutoFilter,t.Effect),t.AutoFilter.defaults={frequency:1,type:"sine",depth:1,baseFrequency:200,octaves:2.6,filter:{type:"lowpass",rolloff:-12,Q:1}},t.AutoFilter.prototype.start=function(t){return this._lfo.start(t),this},t.AutoFilter.prototype.stop=function(t){return this._lfo.stop(t),this},t.AutoFilter.prototype.sync=function(t){return this._lfo.sync(t),this},t.AutoFilter.prototype.unsync=function(){return this._lfo.unsync(),this},Object.defineProperty(t.AutoFilter.prototype,"type",{get:function(){return this._lfo.type},set:function(t){this._lfo.type=t}}),Object.defineProperty(t.AutoFilter.prototype,"baseFrequency",{get:function(){return this._lfo.min},set:function(t){this._lfo.min=this.toFrequency(t),this.octaves=this._octaves}}),Object.defineProperty(t.AutoFilter.prototype,"octaves",{get:function(){return this._octaves},set:function(t){this._octaves=t,this._lfo.max=this.baseFrequency*Math.pow(2,t)}}),t.AutoFilter.prototype.dispose=function(){return t.Effect.prototype.dispose.call(this),this._lfo.dispose(),this._lfo=null,this.filter.dispose(),this.filter=null,this._writable(["frequency","depth"]),this.frequency=null,this.depth=null,this},t.AutoFilter}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(23),i(10),i(19),i(1),i(22),i(28)],void 0===(o=function(t){"use strict";t.Listener=function(){t.call(this),this._orientation=[0,0,0,0,0,0],this._position=[0,0,0],t.getContext(function(){this.set(e.defaults),this.context.listener=this}.bind(this))},t.extend(t.Listener),t.Listener.defaults={positionX:0,positionY:0,positionZ:0,forwardX:0,forwardY:0,forwardZ:1,upX:0,upY:1,upZ:0},t.Listener.prototype.isListener=!0,t.Listener.prototype._rampTimeConstant=.01,t.Listener.prototype.setPosition=function(t,e,i){if(this.context.rawContext.listener.positionX){var n=this.now();this.context.rawContext.listener.positionX.setTargetAtTime(t,n,this._rampTimeConstant),this.context.rawContext.listener.positionY.setTargetAtTime(e,n,this._rampTimeConstant),this.context.rawContext.listener.positionZ.setTargetAtTime(i,n,this._rampTimeConstant)}else this.context.rawContext.listener.setPosition(t,e,i);return this._position=Array.prototype.slice.call(arguments),this},t.Listener.prototype.setOrientation=function(t,e,i,n,o,s){if(this.context.rawContext.listener.forwardX){var r=this.now();this.context.rawContext.listener.forwardX.setTargetAtTime(t,r,this._rampTimeConstant),this.context.rawContext.listener.forwardY.setTargetAtTime(e,r,this._rampTimeConstant),this.context.rawContext.listener.forwardZ.setTargetAtTime(i,r,this._rampTimeConstant),this.context.rawContext.listener.upX.setTargetAtTime(n,r,this._rampTimeConstant),this.context.rawContext.listener.upY.setTargetAtTime(o,r,this._rampTimeConstant),this.context.rawContext.listener.upZ.setTargetAtTime(s,r,this._rampTimeConstant)}else this.context.rawContext.listener.setOrientation(t,e,i,n,o,s);return this._orientation=Array.prototype.slice.call(arguments),this},Object.defineProperty(t.Listener.prototype,"positionX",{set:function(t){this._position[0]=t,this.setPosition.apply(this,this._position)},get:function(){return this._position[0]}}),Object.defineProperty(t.Listener.prototype,"positionY",{set:function(t){this._position[1]=t,this.setPosition.apply(this,this._position)},get:function(){return this._position[1]}}),Object.defineProperty(t.Listener.prototype,"positionZ",{set:function(t){this._position[2]=t,this.setPosition.apply(this,this._position)},get:function(){return this._position[2]}}),Object.defineProperty(t.Listener.prototype,"forwardX",{set:function(t){this._orientation[0]=t,this.setOrientation.apply(this,this._orientation)},get:function(){return this._orientation[0]}}),Object.defineProperty(t.Listener.prototype,"forwardY",{set:function(t){this._orientation[1]=t,this.setOrientation.apply(this,this._orientation)},get:function(){return this._orientation[1]}}),Object.defineProperty(t.Listener.prototype,"forwardZ",{set:function(t){this._orientation[2]=t,this.setOrientation.apply(this,this._orientation)},get:function(){return this._orientation[2]}}),Object.defineProperty(t.Listener.prototype,"upX",{set:function(t){this._orientation[3]=t,this.setOrientation.apply(this,this._orientation)},get:function(){return this._orientation[3]}}),Object.defineProperty(t.Listener.prototype,"upY",{set:function(t){this._orientation[4]=t,this.setOrientation.apply(this,this._orientation)},get:function(){return this._orientation[4]}}),Object.defineProperty(t.Listener.prototype,"upZ",{set:function(t){this._orientation[5]=t,this.setOrientation.apply(this,this._orientation)},get:function(){return this._orientation[5]}}),t.Listener.prototype.dispose=function(){return this._orientation=null,this._position=null,this};var e=t.Listener;return t.Listener=new e,t.Context.on("init",function(i){i.listener&&i.listener.isListener?t.Listener=i.listener:t.Listener=new e}),t.Listener}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(24)],void 0===(o=function(t){"use strict";return t.Draw=function(){t.call(this),this._events=new t.Timeline,this.expiration=.25,this.anticipation=.008,this._boundDrawLoop=this._drawLoop.bind(this)},t.extend(t.Draw),t.Draw.prototype.schedule=function(t,e){return this._events.add({callback:t,time:this.toSeconds(e)}),1===this._events.length&&requestAnimationFrame(this._boundDrawLoop),this},t.Draw.prototype.cancel=function(t){return this._events.cancel(this.toSeconds(t)),this},t.Draw.prototype._drawLoop=function(){for(var e=t.context.currentTime;this._events.length&&this._events.peek().time-this.anticipation<=e;){var i=this._events.shift();e-i.time<=this.expiration&&i.callback()}this._events.length>0&&requestAnimationFrame(this._boundDrawLoop)},t.Draw=new t.Draw,t.Draw}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(3)],void 0===(o=function(t){"use strict";var e={};return t.prototype.send=function(i,n){e.hasOwnProperty(i)||(e[i]=this.context.createGain()),n=t.defaultArg(n,0);var o=new t.Gain(n,t.Type.Decibels);return this.connect(o),o.connect(e[i]),o},t.prototype.receive=function(t,i){return e.hasOwnProperty(t)||(e[t]=this.context.createGain()),e[t].connect(this,0,i),this},t.Context.on("init",function(t){t.buses?e=t.buses:(e={},t.buses=e)}),t}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(4)],void 0===(o=function(t){"use strict";return t.CtrlRandom=function(){var e=t.defaults(arguments,["min","max"],t.CtrlRandom);t.call(this),this.min=e.min,this.max=e.max,this.integer=e.integer},t.extend(t.CtrlRandom),t.CtrlRandom.defaults={min:0,max:1,integer:!1},Object.defineProperty(t.CtrlRandom.prototype,"value",{get:function(){var t=this.toSeconds(this.min),e=this.toSeconds(this.max),i=Math.random(),n=i*t+(1-i)*e;return this.integer&&(n=Math.floor(n)),n}}),t.CtrlRandom}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0)],void 0===(o=function(t){"use strict";return t.CtrlMarkov=function(e,i){t.call(this),this.values=t.defaultArg(e,{}),this.value=t.defaultArg(i,Object.keys(this.values)[0])},t.extend(t.CtrlMarkov),t.CtrlMarkov.prototype.next=function(){if(this.values.hasOwnProperty(this.value)){var e=this.values[this.value];if(t.isArray(e))for(var i=this._getProbDistribution(e),n=Math.random(),o=0,s=0;s<i.length;s++){var r=i[s];if(n>o&&n<o+r){var a=e[s];t.isObject(a)?this.value=a.value:this.value=a}o+=r}else this.value=e}return this.value},t.CtrlMarkov.prototype._getProbDistribution=function(e){for(var i=[],n=0,o=!1,s=0;s<e.length;s++){var r=e[s];t.isObject(r)?(o=!0,i[s]=r.probability):i[s]=1/e.length,n+=i[s]}if(o)for(var a=0;a<i.length;a++)i[a]=i[a]/n;return i},t.CtrlMarkov.prototype.dispose=function(){this.values=null},t.CtrlMarkov}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(4)],void 0===(o=function(t){"use strict";return t.CtrlInterpolate=function(){var e=t.defaults(arguments,["values","index"],t.CtrlInterpolate);t.call(this),this.values=e.values,this.index=e.index},t.extend(t.CtrlInterpolate),t.CtrlInterpolate.defaults={index:0,values:[]},Object.defineProperty(t.CtrlInterpolate.prototype,"value",{get:function(){var t=this.index;t=Math.min(t,this.values.length-1);var e=Math.floor(t),i=this.values[e],n=this.values[Math.ceil(t)];return this._interpolate(t-e,i,n)}}),t.CtrlInterpolate.prototype._interpolate=function(e,i,n){if(t.isArray(i)){for(var o=[],s=0;s<i.length;s++)o[s]=this._interpolate(e,i[s],n[s]);return o}if(t.isObject(i)){var r={};for(var a in i)r[a]=this._interpolate(e,i[a],n[a]);return r}return(1-e)*(i=this._toNumber(i))+e*(n=this._toNumber(n))},t.CtrlInterpolate.prototype._toNumber=function(e){return t.isNumber(e)?e:this.toSeconds(e)},t.CtrlInterpolate.prototype.dispose=function(){this.values=null},t.CtrlInterpolate}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(44),i(2)],void 0===(o=function(t){return t.Waveform=function(){var e=t.defaults(arguments,["size"],t.Waveform);e.type=t.Analyser.Type.Waveform,t.AudioNode.call(this),this._analyser=this.input=this.output=new t.Analyser(e)},t.extend(t.Waveform,t.AudioNode),t.Waveform.defaults={size:1024},t.Waveform.prototype.getValue=function(){return this._analyser.getValue()},Object.defineProperty(t.Waveform.prototype,"size",{get:function(){return this._analyser.size},set:function(t){this._analyser.size=t}}),t.Waveform.prototype.dispose=function(){t.AudioNode.prototype.dispose.call(this),this._analyser.dispose(),this._analyser=null},t.Waveform}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(23),i(10),i(19),i(1),i(22),i(28),i(2)],void 0===(o=function(t){"use strict";return t.Panner3D=function(){var e=t.defaults(arguments,["positionX","positionY","positionZ"],t.Panner3D);t.AudioNode.call(this),this._panner=this.input=this.output=this.context.createPanner(),this._panner.panningModel=e.panningModel,this._panner.maxDistance=e.maxDistance,this._panner.distanceModel=e.distanceModel,this._panner.coneOuterGain=e.coneOuterGain,this._panner.coneOuterAngle=e.coneOuterAngle,this._panner.coneInnerAngle=e.coneInnerAngle,this._panner.refDistance=e.refDistance,this._panner.rolloffFactor=e.rolloffFactor,this._orientation=[e.orientationX,e.orientationY,e.orientationZ],this._position=[e.positionX,e.positionY,e.positionZ],this.orientationX=e.orientationX,this.orientationY=e.orientationY,this.orientationZ=e.orientationZ,this.positionX=e.positionX,this.positionY=e.positionY,this.positionZ=e.positionZ},t.extend(t.Panner3D,t.AudioNode),t.Panner3D.defaults={positionX:0,positionY:0,positionZ:0,orientationX:0,orientationY:0,orientationZ:0,panningModel:"equalpower",maxDistance:1e4,distanceModel:"inverse",coneOuterGain:0,coneOuterAngle:360,coneInnerAngle:360,refDistance:1,rolloffFactor:1},t.Panner3D.prototype._rampTimeConstant=.01,t.Panner3D.prototype.setPosition=function(t,e,i){if(this._panner.positionX){var n=this.now();this._panner.positionX.setTargetAtTime(t,n,this._rampTimeConstant),this._panner.positionY.setTargetAtTime(e,n,this._rampTimeConstant),this._panner.positionZ.setTargetAtTime(i,n,this._rampTimeConstant)}else this._panner.setPosition(t,e,i);return this._position=Array.prototype.slice.call(arguments),this},t.Panner3D.prototype.setOrientation=function(t,e,i){if(this._panner.orientationX){var n=this.now();this._panner.orientationX.setTargetAtTime(t,n,this._rampTimeConstant),this._panner.orientationY.setTargetAtTime(e,n,this._rampTimeConstant),this._panner.orientationZ.setTargetAtTime(i,n,this._rampTimeConstant)}else this._panner.setOrientation(t,e,i);return this._orientation=Array.prototype.slice.call(arguments),this},Object.defineProperty(t.Panner3D.prototype,"positionX",{set:function(t){this._position[0]=t,this.setPosition.apply(this,this._position)},get:function(){return this._position[0]}}),Object.defineProperty(t.Panner3D.prototype,"positionY",{set:function(t){this._position[1]=t,this.setPosition.apply(this,this._position)},get:function(){return this._position[1]}}),Object.defineProperty(t.Panner3D.prototype,"positionZ",{set:function(t){this._position[2]=t,this.setPosition.apply(this,this._position)},get:function(){return this._position[2]}}),Object.defineProperty(t.Panner3D.prototype,"orientationX",{set:function(t){this._orientation[0]=t,this.setOrientation.apply(this,this._orientation)},get:function(){return this._orientation[0]}}),Object.defineProperty(t.Panner3D.prototype,"orientationY",{set:function(t){this._orientation[1]=t,this.setOrientation.apply(this,this._orientation)},get:function(){return this._orientation[1]}}),Object.defineProperty(t.Panner3D.prototype,"orientationZ",{set:function(t){this._orientation[2]=t,this.setOrientation.apply(this,this._orientation)},get:function(){return this._orientation[2]}}),t.Panner3D._aliasProperty=function(e){Object.defineProperty(t.Panner3D.prototype,e,{set:function(t){this._panner[e]=t},get:function(){return this._panner[e]}})},t.Panner3D._aliasProperty("panningModel"),t.Panner3D._aliasProperty("refDistance"),t.Panner3D._aliasProperty("rolloffFactor"),t.Panner3D._aliasProperty("distanceModel"),t.Panner3D._aliasProperty("coneInnerAngle"),t.Panner3D._aliasProperty("coneOuterAngle"),t.Panner3D._aliasProperty("coneOuterGain"),t.Panner3D._aliasProperty("maxDistance"),t.Panner3D.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._panner.disconnect(),this._panner=null,this._orientation=null,this._position=null,this},t.Panner3D}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(59),i(43),i(2)],void 0===(o=function(t){"use strict";return t.MultibandCompressor=function(e){t.AudioNode.call(this),e=t.defaultArg(arguments,t.MultibandCompressor.defaults),this._splitter=this.input=new t.MultibandSplit({lowFrequency:e.lowFrequency,highFrequency:e.highFrequency}),this.lowFrequency=this._splitter.lowFrequency,this.highFrequency=this._splitter.highFrequency,this.output=new t.Gain,this.low=new t.Compressor(e.low),this.mid=new t.Compressor(e.mid),this.high=new t.Compressor(e.high),this._splitter.low.chain(this.low,this.output),this._splitter.mid.chain(this.mid,this.output),this._splitter.high.chain(this.high,this.output),this._readOnly(["high","mid","low","highFrequency","lowFrequency"])},t.extend(t.MultibandCompressor,t.AudioNode),t.MultibandCompressor.defaults={low:t.Compressor.defaults,mid:t.Compressor.defaults,high:t.Compressor.defaults,lowFrequency:250,highFrequency:2e3},t.MultibandCompressor.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._splitter.dispose(),this._writable(["high","mid","low","highFrequency","lowFrequency"]),this.low.dispose(),this.mid.dispose(),this.high.dispose(),this._splitter=null,this.low=null,this.mid=null,this.high=null,this.lowFrequency=null,this.highFrequency=null,this},t.MultibandCompressor}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(10),i(2)],void 0===(o=function(t){"use strict";return t.Mono=function(){t.AudioNode.call(this),this.createInsOuts(1,0),this._merge=this.output=new t.Merge,this.input.connect(this._merge,0,0),this.input.connect(this._merge,0,1)},t.extend(t.Mono,t.AudioNode),t.Mono.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._merge.dispose(),this._merge=null,this},t.Mono}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(52),i(51),i(43),i(2)],void 0===(o=function(t){"use strict";return t.MidSideCompressor=function(e){t.AudioNode.call(this),e=t.defaultArg(e,t.MidSideCompressor.defaults),this._midSideSplit=this.input=new t.MidSideSplit,this._midSideMerge=this.output=new t.MidSideMerge,this.mid=new t.Compressor(e.mid),this.side=new t.Compressor(e.side),this._midSideSplit.mid.chain(this.mid,this._midSideMerge.mid),this._midSideSplit.side.chain(this.side,this._midSideMerge.side),this._readOnly(["mid","side"])},t.extend(t.MidSideCompressor,t.AudioNode),t.MidSideCompressor.defaults={mid:{ratio:3,threshold:-24,release:.03,attack:.02,knee:16},side:{ratio:6,threshold:-30,release:.25,attack:.03,knee:10}},t.MidSideCompressor.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._writable(["mid","side"]),this.mid.dispose(),this.mid=null,this.side.dispose(),this.side=null,this._midSideSplit.dispose(),this._midSideSplit=null,this._midSideMerge.dispose(),this._midSideMerge=null,this},t.MidSideCompressor}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(44),i(2)],void 0===(o=function(t){"use strict";return t.Meter=function(){var e=t.defaults(arguments,["smoothing"],t.Meter);t.AudioNode.call(this),this.smoothing=e.smoothing,this._rms=0,this.input=this.output=this._analyser=new t.Analyser("waveform",256)},t.extend(t.Meter,t.AudioNode),t.Meter.defaults={smoothing:.8},t.Meter.prototype.getLevel=function(){for(var e=this._analyser.getValue(),i=0,n=0;n<e.length;n++){var o=e[n];i+=o*o}var s=Math.sqrt(i/e.length);return this._rms=Math.max(s,this._rms*this.smoothing),t.gainToDb(this._rms)},t.Meter.prototype.getValue=function(){return this._analyser.getValue()[0]},t.Meter.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._analyser.dispose(),this._analyser=null,this},t.Meter}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(43),i(2)],void 0===(o=function(t){"use strict";return t.Limiter=function(){var e=t.defaults(arguments,["threshold"],t.Limiter);t.AudioNode.call(this),this._compressor=this.input=this.output=new t.Compressor({attack:.001,decay:.001,threshold:e.threshold}),this.threshold=this._compressor.threshold,this._readOnly("threshold")},t.extend(t.Limiter,t.AudioNode),t.Limiter.defaults={threshold:-12},t.Limiter.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._compressor.dispose(),this._compressor=null,this._writable("threshold"),this.threshold=null,this},t.Limiter}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(57),i(88),i(2)],void 0===(o=function(t){"use strict";return t.Gate=function(){var e=t.defaults(arguments,["threshold","smoothing"],t.Gate);t.AudioNode.call(this),this.createInsOuts(1,1),this._follower=new t.Follower(e.smoothing),this._gt=new t.GreaterThan(t.dbToGain(e.threshold)),this.input.connect(this.output),this.input.chain(this._follower,this._gt,this.output.gain)},t.extend(t.Gate,t.AudioNode),t.Gate.defaults={smoothing:.1,threshold:-40},Object.defineProperty(t.Gate.prototype,"threshold",{get:function(){return t.gainToDb(this._gt.value)},set:function(e){this._gt.value=t.dbToGain(e)}}),Object.defineProperty(t.Gate.prototype,"smoothing",{get:function(){return this._follower.smoothing},set:function(t){this._follower.smoothing=t}}),t.Gate.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._follower.dispose(),this._gt.dispose(),this._follower=null,this._gt=null,this},t.Gate}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(44),i(2)],void 0===(o=function(t){return t.FFT=function(){var e=t.defaults(arguments,["size"],t.FFT);e.type=t.Analyser.Type.FFT,t.AudioNode.call(this),this._analyser=this.input=this.output=new t.Analyser(e)},t.extend(t.FFT,t.AudioNode),t.FFT.defaults={size:1024},t.FFT.prototype.getValue=function(){return this._analyser.getValue()},Object.defineProperty(t.FFT.prototype,"size",{get:function(){return this._analyser.size},set:function(t){this._analyser.size=t}}),t.FFT.prototype.dispose=function(){t.AudioNode.prototype.dispose.call(this),this._analyser.dispose(),this._analyser=null},t.FFT}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(59),i(3),i(2)],void 0===(o=function(t){"use strict";return t.EQ3=function(){var e=t.defaults(arguments,["low","mid","high"],t.EQ3);t.AudioNode.call(this),this.output=new t.Gain,this._multibandSplit=this.input=new t.MultibandSplit({lowFrequency:e.lowFrequency,highFrequency:e.highFrequency}),this._lowGain=new t.Gain(e.low,t.Type.Decibels),this._midGain=new t.Gain(e.mid,t.Type.Decibels),this._highGain=new t.Gain(e.high,t.Type.Decibels),this.low=this._lowGain.gain,this.mid=this._midGain.gain,this.high=this._highGain.gain,this.Q=this._multibandSplit.Q,this.lowFrequency=this._multibandSplit.lowFrequency,this.highFrequency=this._multibandSplit.highFrequency,this._multibandSplit.low.chain(this._lowGain,this.output),this._multibandSplit.mid.chain(this._midGain,this.output),this._multibandSplit.high.chain(this._highGain,this.output),this._readOnly(["low","mid","high","lowFrequency","highFrequency"])},t.extend(t.EQ3,t.AudioNode),t.EQ3.defaults={low:0,mid:0,high:0,lowFrequency:400,highFrequency:2500},t.EQ3.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._writable(["low","mid","high","lowFrequency","highFrequency"]),this._multibandSplit.dispose(),this._multibandSplit=null,this.lowFrequency=null,this.highFrequency=null,this._lowGain.dispose(),this._lowGain=null,this._midGain.dispose(),this._midGain=null,this._highGain.dispose(),this._highGain=null,this.low=null,this.mid=null,this.high=null,this.Q=null,this},t.EQ3}.apply(e,n))||(t.exports=o)},function(t,e,i){var n,o;n=[i(0),i(95),i(91),i(2)],void 0===(o=function(t){return t.Channel=function(){var e=t.defaults(arguments,["volume","pan"],t.PanVol);t.AudioNode.call(this,e),this._solo=this.input=new t.Solo(e.solo),this._panVol=this.output=new t.PanVol({pan:e.pan,volume:e.volume,mute:e.mute}),this.pan=this._panVol.pan,this.volume=this._panVol.volume,this._solo.connect(this._panVol),this._readOnly(["pan","volume"])},t.extend(t.Channel,t.AudioNode),t.Channel.defaults={pan:0,volume:0,mute:!1,solo:!1},Object.defineProperty(t.Channel.prototype,"solo",{get:function(){return this._solo.solo},set:function(t){this._solo.solo=t}}),Object.defineProperty(t.Channel.prototype,"muted",{get:function(){return this._solo.muted||this.mute}}),Object.defineProperty(t.Channel.prototype,"mute",{get:function(){return this._panVol.mute},set:function(t){this._panVol.mute=t}}),t.Channel.prototype.dispose=function(){return t.AudioNode.prototype.dispose.call(this),this._writable(["pan","volume"]),this._panVol.dispose(),this._panVol=null,this.pan=null,this.volume=null,this._solo.dispose(),this._solo=null,this},t.Channel}.apply(e,n))||(t.exports=o)},function(t,e){t.exports="13.4.9"},function(t,e){var i;i=function(){return this}();try{i=i||Function("return this")()||(0,eval)("this")}catch(t){"object"==typeof window&&(i=window)}t.exports=i},function(t,e,i){i(30),i(44),i(152),i(43),i(23),i(47),i(151),i(58),i(150),i(9),i(57),i(41),i(149),i(12),i(148),i(53),i(10),i(147),i(146),i(51),i(52),i(145),i(144),i(59),i(60),i(143),i(95),i(89),i(91),i(19),i(27),i(142),i(141),i(140),i(80),i(139),i(2),i(11),i(79),i(138),i(86),i(20),i(18),i(137),i(35),i(3),i(84),i(136),i(40),i(78),i(62),i(14),i(24),i(33),i(16),i(55),i(83),i(135),i(134),i(133),i(132),i(131),i(130),i(76),i(129),i(8),i(128),i(32),i(127),i(126),i(75),i(125),i(124),i(123),i(122),i(15),i(121),i(120),i(74),i(119),i(118),i(50),i(73),i(72),i(117),i(116),i(115),i(114),i(113),i(21),i(112),i(111),i(25),i(68),i(110),i(109),i(108),i(107),i(38),i(96),i(81),i(34),i(63),i(97),i(66),i(106),i(92),i(98),i(90),i(29),i(22),i(93),i(105),i(88),i(87),i(77),i(5),i(94),i(104),i(61),i(26),i(42),i(1),i(36),i(13),i(85),i(103),i(7),i(28),i(70),i(31),i(69),i(48),i(102),i(39),i(37),i(17),i(82),i(67),i(101),i(49),i(71),i(6),i(56),i(100),i(46),i(99),i(54),i(65),i(64),i(45),i(4),t.exports=i(0)}])});

},{}],49:[function(require,module,exports){
'use strict';

var alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'.split('')
  , length = 64
  , map = {}
  , seed = 0
  , i = 0
  , prev;

/**
 * Return a string representing the specified number.
 *
 * @param {Number} num The number to convert.
 * @returns {String} The string representation of the number.
 * @api public
 */
function encode(num) {
  var encoded = '';

  do {
    encoded = alphabet[num % length] + encoded;
    num = Math.floor(num / length);
  } while (num > 0);

  return encoded;
}

/**
 * Return the integer value specified by the given string.
 *
 * @param {String} str The string to convert.
 * @returns {Number} The integer value represented by the string.
 * @api public
 */
function decode(str) {
  var decoded = 0;

  for (i = 0; i < str.length; i++) {
    decoded = decoded * length + map[str.charAt(i)];
  }

  return decoded;
}

/**
 * Yeast: A tiny growing id generator.
 *
 * @returns {String} A unique id.
 * @api public
 */
function yeast() {
  var now = encode(+new Date());

  if (now !== prev) return seed = 0, prev = now;
  return now +'.'+ encode(seed++);
}

//
// Map each character to its index.
//
for (; i < length; i++) map[alphabet[i]] = i;

//
// Expose the `yeast`, `encode` and `decode` functions.
//
yeast.encode = encode;
yeast.decode = decode;
module.exports = yeast;

},{}],50:[function(require,module,exports){
'use strict'

let tempText = document.querySelector('#temperature')
let humText = document.querySelector('#humidity')
let airPressureText = document.querySelector('#air-pressure')
let lumiText = document.querySelector('#luminosity')

const Tone = require('tone')

let socket = require('socket.io-client')('http://localhost:3000')

let temperature = 0
let humidity = 0
let pressure = 0
let lux = 0

let noteIndex
let noteTempIndex

let numberOfWaveformStaples = 64

let waveDiv = document.querySelector('#wave-form')
for (let i = 0; i < numberOfWaveformStaples; i++) {
    let div = document.createElement('div')
    div.setAttribute('class', 'wave')
    waveDiv.appendChild(div)
}

let staples = document.querySelectorAll('.wave')

socket.on('event', (weatherData) => {
    checkWeatherData(weatherData)
    renderWeatherData()
    updateMusicalValues()
})

let checkWeatherData = (weatherData) => {
    if (weatherData.temperature){
        temperature = weatherData.temperature.toFixed(1)
    }
    if (weatherData.humidity){
        humidity = weatherData.humidity.toFixed(1)
    }
    if (weatherData.pressure) {
        pressure = weatherData.pressure.toFixed(1)
    }
    if (weatherData.luminosity.lux) {
        lux = weatherData.luminosity.lux.toFixed(1)
    }
}

let renderWeatherData = () => {
    if(temperature){
        tempText.innerHTML = `${temperature} °C |`
    }
    if(humidity){
        humText.innerHTML = `${humidity} % |`
    }
    if (pressure) {
        airPressureText.innerHTML = `${pressure} hPa |`
    }
    if (lux) {
        lumiText.innerHTML = `${lux} lux`
    }   
}

let notes = ['C#1', 'D#1', 'F#1', 'G#1', 'Bb1', 'C#2', 'D#2', 'F#2', 'G#2', 'Bb2', 'C#3', 'D#3', 'F#3', 'G#3', 'Bb3', 'C#4', 'D#4', 'F#4', 'G#4', 'Bb4','C#5', 'D#5', 'F#5', 'G#5', 'Bb5', 'C#6', 'D#6', 'F#6', 'G#6', 'Bb6']
let Analyser = require('tone').Analyser
let analyser = new Analyser('waveform', numberOfWaveformStaples)

let Freeverb = require('tone').Freeverb
let brightnessReverb = new Freeverb(0.9).toMaster()
let humidityReverb = new Freeverb().toMaster()

let PingPongDelay = require('tone').PingPongDelay
let pingPong = new PingPongDelay(0.25, 0.8)

let eq = new Tone.EQ3()


let updateMusicalValues = () => {
    if (lux) {
        let normalizedLux = lux / 40000
        noteIndex = Math.floor(normalizedLux * notes.length)
    }
    if (pressure) {
        let normalisedPressureInversed = 1 - pressure / 1100
        let pressureValue = normalisedPressureInversed * 15
        eq.low.value = pressureValue
    }

    if (humidity) {
        let normalizedHumidity = humidity / 100
        humidityReverb.roomSize.value = normalizedHumidity
    }

    if (temperature) {
    let normalizedTemp = (temperature + 60) / 120
    noteTempIndex = Math.ceil(normalizedTemp * notes.length)
    }
}

let luxSynth1 = new Tone.MonoSynth({
    type: 'square',
    envelope: {
        'attack': 0.1,
        'decay': 1,
        'sustain': 1,
        'release': 2        
    }
})

let luxSynth2 = new Tone.MonoSynth({
    type: 'sawtooth',
    envelope: {
        'attack': 0.2,
        'decay': 1,
        'sustain': 1,
        'release': 2        
    }
})

let luxSynth3 = new Tone.MonoSynth({
    type: 'sine',
    envelope: {
        'attack': 0.2,
        'decay': 1,
        'sustain': 1,
        'release': 2        
    }
})

let noiseSynth = new Tone.NoiseSynth({
    type: 'brown',
    envelope : {
        'attack' : 3,
        'decay' : 5,
        'sustain': 0.5
        } 
})

let tempSynth = new Tone.MonoSynth()

new Tone.LFO({
    'frequency': 1,
    'min': -10,
    'max': 10
}).fan(luxSynth1.detune).start()

new Tone.LFO({
    'frequency': 3,
    'min': -30,
    'max': 30
}).fan(luxSynth2.detune).start()

new Tone.LFO({
    'frequency': 0.1,
    'min': -10,
    'max': 10
}).fan(luxSynth3.detune).start()

new Tone.LFO({
    'frequency': 0.1,
    'min': -3,
    'max': 3
}).fan(noiseSynth.volume).start()

luxSynth1.chain(brightnessReverb, analyser)
luxSynth2.chain(brightnessReverb, analyser)
luxSynth3.chain(brightnessReverb, analyser)
noiseSynth.chain(eq, humidityReverb, analyser)
tempSynth.chain(pingPong, humidityReverb, analyser)


Tone.Transport.scheduleRepeat((time) => {
    let note1 = notes[noteIndex]
    let note2 = notes[noteIndex] + 8
    let note3 = notes[noteIndex] + 12
    let maxRange = noteIndex.length -12
    if (noteIndex > maxRange) {
        note2 = notes[noteIndex] 
        note3 = notes[noteIndex] 
    }

    luxSynth1.triggerAttackRelease(note1, 5, time)
    luxSynth2.triggerAttackRelease(note2, 5, time)
    luxSynth2.triggerAttackRelease(note3, 5, time)
    noiseSynth.triggerAttackRelease(5)
    tempSynth.triggerAttackRelease(notes[noteTempIndex], '8n', time)
}, 2)

Tone.Transport.scheduleRepeat((time) => {
    Tone.Draw.schedule(() => {
        let values = analyser.getValue()
        if (values) {
            values.forEach((element, index) => {
                let height = 200 - (element * 10)
                staples[index].setAttribute('style', `height:${height}px`)
            })
        }
        
    }, time)
}, 0.1)

Tone.Transport.start()
Tone.Transport.bpm.value = 60
Tone.Master.volume.value = -40



},{"socket.io-client":35,"tone":48}]},{},[50]);
