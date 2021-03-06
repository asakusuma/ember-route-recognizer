import SegmentTrieNode from './segment-trie/segment-trie-node';
import DynamicSegment from './segment-trie/dynamic-segment';
import EpsilonSegment from './segment-trie/epsilon-segment';
import GlobNode from './segment-trie/glob-node';
import StaticSegment from './segment-trie/static-segment';

import { bind } from './polyfills';

function buildSegmentTrieNode(router, value) {
  if (value === undefined) {
    return new EpsilonSegment(...arguments);
  }
  switch (value.charCodeAt(0)) {
    case 58: return new DynamicSegment(router, value.substr(1)); // : => 58
    case 42: return new GlobNode(router, value.substr(1)); // * => 42
    default: return new StaticSegment(router, value);
  }
}

function matcher(source) {
  return function matcher(path, callback) {
    var leaf = this;
    path = path.replace(/^[\/]*/, '');
    path = path.replace(/[\/]*$/, '');

    var segments;
    if (path === '') {
      // Gets an epsilon segment.
      segments = [ undefined ];
    } else {
      segments = path.split('/');
    }

    // As we're adding segments we need to track the current leaf.
    for (var i = 0; i < segments.length; i++) {
      segments[i] = buildSegmentTrieNode(this.router, segments[i]);

      leaf = leaf.append(segments[i]);
    }

    if (callback) {
      // No handler, delegate back to the TrieNode's `to` method.
      leaf.to(undefined, callback, source);
    }

    return leaf;
  };
}

// So, this is sad, but we don't get circular references that do the right thing.
SegmentTrieNode.prototype.to = function to(handler, callback, source) {
  this.handler = handler;

  var targetNode = this._existingOrSelf();
  if (targetNode !== this) {
    this.haystack = this.haystack.splice(this.haystack.indexOf(this), 1);
    this.router.nodes[this.id] = undefined;
    return targetNode;
  }

  if (handler && this.router.addRouteCallback && source !== 'add') {
    var routes = [];
    var segmentTrieNode = this;
    var prefix = '';

    do {
      // We've found a new handler, start building it up again.
      if (segmentTrieNode.handler) {
        routes.unshift({
          path: '',
          handler: segmentTrieNode.handler
        });
      }

      switch (segmentTrieNode.type) {
        case 'dynamic': prefix = '/:'; break;
        case 'glob': prefix = '/*'; break;
        case 'epsilon': prefix = ''; break;
        default:
        case 'static':
          prefix = '/';
        break;
      }
      if (segmentTrieNode.type === 'epsilon' && routes[0].path === '') {
        routes[0].path = '/';
      }
      if (segmentTrieNode.type !== 'epsilon') {
        routes[0].path = prefix + segmentTrieNode.value + routes[0].path;
      }
    } while (segmentTrieNode = segmentTrieNode.parent);

    this.router.addRouteCallback(this.router, routes);
  }

  if (callback) {
    if (callback.length === 0) { throw new Error("You must have an argument in the function passed to `to`"); }
    callback(bind(matcher(source), this));
  }

  return this;
};

export { matcher };
