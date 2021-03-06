import { oCreate } from './polyfills';

// This object is the accumulator for handlers when recognizing a route.
// It's nothing more than an array with a bonus property.
function RecognizeResults(queryParams) {
  this.queryParams = queryParams || {};
}
RecognizeResults.prototype = oCreate({
  splice: Array.prototype.splice,
  slice:  Array.prototype.slice,
  push:   Array.prototype.push,
  pop:    Array.prototype.pop,
  unshift:    Array.prototype.unshift,
  length: 0,
  specificity: null,
  queryParams: null
});

export default RecognizeResults;
