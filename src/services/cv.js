class CV {

  /**
   * This method is used to dispatch an event to the worker. 
   * @param {string} msg
   * @param {Object} payload
   * @returns {Promise} - resolves with the result of the dispatched action
   */
  _dispatch(event) {
    const { msg } = event
    this._status[msg] = ['loading']
    this.worker.postMessage(event)
    return new Promise((res, rej) => {
      let interval = setInterval(() => {
        const status = this._status[msg]
        if (status == undefined) return
        if (status[0] === 'done') res(status[1])
        if (status[0] === 'error') rej(status[1])
        if (status[0] !== 'loading') {
          delete this._status[msg]
          clearInterval(interval)
        }
      }, 50)
    })
  }

  /**
   * This method is used to initialize the worker. It will be called by the main thread.
   * @param {string} msg
   * @param {string} status
   * @param {*} payload
   * @returns {Promise<*>} A promise that resolves with the result of the event.
   */
  load() {
    this._status = {}
    this.worker = new Worker('/js/cv.worker.js') // load worker

    // Capture events and save [status, event] inside the _status object
    this.worker.onmessage = (e) => (this._status[e.data.msg] = ['done', e])
    this.worker.onerror = (e) => (this._status[e.data] = ['error', e])
    return this._dispatch({ msg: 'load' })
  }

  // load the classifier for plate detection
  loadClassifier() {
    return this._dispatch({ msg: 'loadClassifier' })
  }

  // Process the frame and return the result
  detectPlate(payload) {
    return this._dispatch({ msg: 'detectPlate', payload })
  }
}

// Export the same instant everywhere
export default new CV()
