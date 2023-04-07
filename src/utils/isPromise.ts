/**
 * Determine whether the given `promise` is a Promise.
 *
 * @param {*} promise
 *
 * @returns {Boolean}
 */
function isPromise(promise: any) {
    return !!promise && typeof promise.then === 'function';
}

export default isPromise;
